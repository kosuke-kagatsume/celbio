import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 発注詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true, code: true, address: true, phone: true } },
        user: { select: { id: true, name: true, email: true } },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            title: true,
            category: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            partner: { select: { id: true, name: true, code: true } },
            product: { select: { id: true, name: true, code: true } },
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 });
    }

    // アクセス権チェック
    if (user.role === 'member' && order.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    if (user.role === 'partner') {
      const hasAccess = order.items.some(item => item.partnerId === user.partnerId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 発注更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 });
    }

    // 権限チェック
    if (user.role === 'member' && order.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    const { status, note, deliveryAddress, desiredDate } = body;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status !== undefined ? status : order.status,
        note: note !== undefined ? note : order.note,
        deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : order.deliveryAddress,
        desiredDate: desiredDate !== undefined ? (desiredDate ? new Date(desiredDate) : null) : order.desiredDate,
      },
      include: {
        member: { select: { id: true, name: true } },
        items: {
          include: {
            partner: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
