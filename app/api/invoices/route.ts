import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 請求書一覧取得
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

    const whereClause: Record<string, unknown> = {};

    if (user.role === 'member') {
      whereClause.memberId = user.memberId;
    } else if (user.role === 'partner') {
      whereClause.partnerId = user.partnerId;
    }

    if (status) {
      whereClause.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          order: { select: { id: true, orderNumber: true } },
          partner: { select: { id: true, name: true, code: true } },
          member: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 請求書発行（メーカーが発行）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'partner' || !user.partnerId) {
      return NextResponse.json(
        { error: 'メーカーユーザーのみ請求書を発行できます' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, dueDate } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: '発注IDが必要です' },
        { status: 400 }
      );
    }

    // 発注情報を取得
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { partnerId: user.partnerId },
        },
        member: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 });
    }

    // 自社の明細があるか確認
    if (order.items.length === 0) {
      return NextResponse.json(
        { error: 'この発注に対する明細がありません' },
        { status: 400 }
      );
    }

    // 既に請求書が発行されているか確認
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        orderId,
        partnerId: user.partnerId,
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'この発注に対する請求書は既に発行されています' },
        { status: 400 }
      );
    }

    // 金額計算
    const amount = order.items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal.toString()),
      0
    );
    const taxRate = 0.1; // 10%
    const taxAmount = Math.floor(amount * taxRate);
    const totalAmount = amount + taxAmount;

    // 請求書番号生成
    const today = new Date();
    const datePrefix = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const monthInvoicesCount = await prisma.invoice.count({
      where: { invoiceNumber: { startsWith: datePrefix } },
    });
    const invoiceNumber = `${datePrefix}-${String(monthInvoicesCount + 1).padStart(5, '0')}`;

    // 請求書作成
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        partnerId: user.partnerId,
        memberId: order.memberId,
        amount,
        taxAmount,
        totalAmount,
        status: 'issued',
        issuedAt: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        order: { select: { id: true, orderNumber: true } },
        partner: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
      },
    });

    // 発注ステータスを更新
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'invoiced' },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
