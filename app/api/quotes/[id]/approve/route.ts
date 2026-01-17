import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 見積承認（→ 発注へ）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 加盟店ユーザーのみ承認可能
    if (user.role !== 'member' || !user.memberId) {
      return NextResponse.json(
        { error: '加盟店ユーザーのみ承認できます' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            partner: true,
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: '見積が見つかりません' }, { status: 404 });
    }

    // 自社の見積か確認
    if (quote.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    // 回答済み状態のみ承認可能
    if (quote.status !== 'responded') {
      return NextResponse.json(
        { error: '回答済みの見積のみ承認できます' },
        { status: 400 }
      );
    }

    // 全ての明細に価格が入っているか確認
    const hasAllPrices = quote.items.every(item => item.unitPrice && item.subtotal);
    if (!hasAllPrices) {
      return NextResponse.json(
        { error: '全ての明細に価格が設定されていません' },
        { status: 400 }
      );
    }

    // 発注番号生成
    const today = new Date();
    const datePrefix = `O${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayOrdersCount = await prisma.order.count({
      where: {
        orderNumber: { startsWith: datePrefix },
      },
    });
    const orderNumber = `${datePrefix}-${String(todayOrdersCount + 1).padStart(4, '0')}`;

    // トランザクションで見積承認と発注作成
    const order = await prisma.$transaction(async (tx) => {
      // 見積を承認状態に更新
      await tx.quote.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
        },
      });

      // 発注を作成
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          memberId: user.memberId!,
          userId: user.id,
          quoteId: id,
          status: 'ordered',
          deliveryAddress: quote.deliveryAddress || '',
          desiredDate: quote.desiredDate,
          totalAmount: quote.totalAmount!,
          orderedAt: new Date(),
        },
      });

      // 発注明細を作成
      for (const item of quote.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            partnerId: item.partnerId,
            productId: item.productId,
            quoteItemId: item.id,
            itemName: item.itemName,
            specification: item.specification,
            quantity: item.quantity!,
            unit: item.unit,
            unitPrice: item.unitPrice!,
            subtotal: item.subtotal!,
            status: 'pending',
          },
        });
      }

      return newOrder;
    });

    // 作成した発注を取得
    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        member: { select: { id: true, name: true } },
        items: {
          include: {
            partner: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      message: '見積を承認し、発注を作成しました',
      quote: { id, status: 'approved' },
      order: createdOrder,
    });
  } catch (error) {
    console.error('Error approving quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
