import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// 未払い請求書一覧取得
export async function GET() {
  try {
    await requireRole(['admin']);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['issued', 'sent'] },
        // まだPaymentに紐づいていないもの
        payments: { none: {} },
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        member: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching unpaid invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
