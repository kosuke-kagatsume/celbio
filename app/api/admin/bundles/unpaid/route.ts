import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// 未払いおまとめ一覧取得
export async function GET() {
  try {
    await requireRole(['admin']);

    const bundles = await prisma.invoiceBundle.findMany({
      where: {
        status: { in: ['created', 'sent'] },
        // まだPaymentに紐づいていないもの
        payments: { none: {} },
      },
      select: {
        id: true,
        bundleNumber: true,
        totalAmount: true,
        member: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ bundles });
  } catch (error) {
    console.error('Error fetching unpaid bundles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
