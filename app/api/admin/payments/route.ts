import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// 入金一覧取得
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};
    if (status) {
      whereClause.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          invoice: {
            include: {
              member: { select: { id: true, name: true } },
              partner: { select: { id: true, name: true } },
              order: { select: { id: true, orderNumber: true } },
            },
          },
          bundle: {
            include: {
              member: { select: { id: true, name: true } },
            },
          },
          bankTransaction: true,
          approver: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 手動入金登録
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const body = await request.json();
    const { invoiceId, bundleId, bankTxnId, amount, note } = body;

    if (!invoiceId && !bundleId) {
      return NextResponse.json(
        { error: '請求書またはおまとめを指定してください' },
        { status: 400 }
      );
    }

    // 対象の請求金額を取得
    let targetAmount = 0;
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) {
        return NextResponse.json({ error: '請求書が見つかりません' }, { status: 404 });
      }
      targetAmount = parseFloat(invoice.totalAmount.toString());
    } else if (bundleId) {
      const bundle = await prisma.invoiceBundle.findUnique({
        where: { id: bundleId },
      });
      if (!bundle) {
        return NextResponse.json({ error: 'おまとめが見つかりません' }, { status: 404 });
      }
      targetAmount = parseFloat(bundle.totalAmount.toString());
    }

    const paymentAmount = parseFloat(amount);
    const difference = paymentAmount - targetAmount;

    // 入金レコード作成
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoiceId || null,
        bundleId: bundleId || null,
        bankTxnId: bankTxnId || null,
        amount: paymentAmount,
        status: difference === 0 ? 'matched' : 'pending',
        matchType: 'manual',
        difference: difference !== 0 ? difference : null,
        note,
      },
      include: {
        invoice: {
          include: {
            member: { select: { id: true, name: true } },
          },
        },
        bundle: {
          include: {
            member: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 銀行取引をマッチ済みに
    if (bankTxnId) {
      await prisma.bankTransaction.update({
        where: { id: bankTxnId },
        data: { matched: true },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
