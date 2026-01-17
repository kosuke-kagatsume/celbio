import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 発注一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // ロールに応じたフィルター
    const whereClause: Record<string, unknown> = {};

    if (user.role === 'member') {
      whereClause.memberId = user.memberId;
    } else if (user.role === 'partner') {
      // メーカーの場合、自社が関係する発注のみ
      whereClause.items = {
        some: { partnerId: user.partnerId }
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          member: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true } },
          quote: { select: { id: true, quoteNumber: true, title: true } },
          items: {
            include: {
              partner: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 直接発注（Type A商品）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'member' || !user.memberId) {
      return NextResponse.json(
        { error: '加盟店ユーザーのみ発注できます' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deliveryAddress, desiredDate, note, items } = body;

    if (!deliveryAddress || !items || items.length === 0) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // 発注番号生成
    const today = new Date();
    const datePrefix = `O${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayOrdersCount = await prisma.order.count({
      where: { orderNumber: { startsWith: datePrefix } },
    });
    const orderNumber = `${datePrefix}-${String(todayOrdersCount + 1).padStart(4, '0')}`;

    // 合計金額を計算
    let totalAmount = 0;
    for (const item of items) {
      const subtotal = parseFloat(item.unitPrice) * parseFloat(item.quantity);
      totalAmount += subtotal;
    }

    // 発注作成
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          memberId: user.memberId!,
          userId: user.id,
          status: 'ordered',
          deliveryAddress,
          desiredDate: desiredDate ? new Date(desiredDate) : null,
          note,
          totalAmount,
          orderedAt: new Date(),
        },
      });

      for (const item of items) {
        const subtotal = parseFloat(item.unitPrice) * parseFloat(item.quantity);
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            partnerId: item.partnerId,
            productId: item.productId || null,
            itemName: item.itemName,
            specification: item.specification,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            unitPrice: parseFloat(item.unitPrice),
            subtotal,
            status: 'pending',
          },
        });
      }

      return newOrder;
    });

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

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
