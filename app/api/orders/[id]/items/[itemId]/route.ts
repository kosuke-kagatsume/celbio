import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 発注明細のステータス更新（出荷・納品）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, itemId } = await params;
    const body = await request.json();
    const { status } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 });
    }

    const item = order.items.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: '明細が見つかりません' }, { status: 404 });
    }

    // メーカーは自社の明細のみ更新可能
    if (user.role === 'partner') {
      if (item.partnerId !== user.partnerId) {
        return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
      }
    } else if (user.role !== 'admin') {
      return NextResponse.json({ error: '更新権限がありません' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status };

    // ステータスに応じた日時を設定
    if (status === 'shipped') {
      updateData.shippedAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        partner: { select: { id: true, name: true } },
      },
    });

    // 全明細が納品完了した場合、発注ステータスを更新
    const allItems = await prisma.orderItem.findMany({
      where: { orderId: id },
    });
    const allDelivered = allItems.every(i => i.status === 'delivered');

    if (allDelivered) {
      await prisma.order.update({
        where: { id },
        data: { status: 'delivered' },
      });
    } else {
      // 一部でも出荷済みならステータスを更新
      const anyShipped = allItems.some(i => i.status === 'shipped' || i.status === 'delivered');
      if (anyShipped && order.status === 'ordered') {
        await prisma.order.update({
          where: { id },
          data: { status: 'shipped' },
        });
      }
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating order item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
