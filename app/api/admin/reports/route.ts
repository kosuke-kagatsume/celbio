import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// 管理者向けレポートデータ取得
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    // 期間の設定
    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    // DB集計で取得（全件ロードしない）
    const [
      orderAgg,
      invoiceAgg,
      paymentAgg,
      activeMembers,
      activePartners,
      memberOrderStats,
      partnerInvoiceStats,
    ] = await Promise.all([
      // 発注集計
      prisma.order.aggregate({
        where: { orderedAt: { gte: startDate, lte: endDate } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // 請求書集計
      prisma.invoice.aggregate({
        where: { issuedAt: { gte: startDate, lte: endDate } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // 入金集計
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['matched', 'approved'] },
        },
        _count: true,
        _sum: { amount: true },
      }),
      // 加盟店数
      prisma.member.count({ where: { isActive: true } }),
      // メーカー数
      prisma.partner.count({ where: { isActive: true } }),
      // 加盟店別発注集計
      prisma.order.groupBy({
        by: ['memberId'],
        where: { orderedAt: { gte: startDate, lte: endDate } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // メーカー別請求書集計
      prisma.invoice.groupBy({
        by: ['partnerId'],
        where: { issuedAt: { gte: startDate, lte: endDate } },
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    // 加盟店・メーカーの名前を取得
    const memberIds = memberOrderStats.map((s) => s.memberId);
    const partnerIds = partnerInvoiceStats.map((s) => s.partnerId);

    const [memberNames, partnerNames] = await Promise.all([
      memberIds.length > 0
        ? prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, name: true },
          })
        : [],
      partnerIds.length > 0
        ? prisma.partner.findMany({
            where: { id: { in: partnerIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const memberNameMap = new Map(memberNames.map((m) => [m.id, m.name]));
    const partnerNameMap = new Map(partnerNames.map((p) => [p.id, p.name]));

    // 月別推移（年間表示の場合、SQLで集計）
    let monthlyData: Array<{
      month: number;
      orders: number;
      orderAmount: number;
      invoices: number;
      invoiceAmount: number;
      payments: number;
      paymentAmount: number;
    }> = [];

    if (!month) {
      // 月別集計を並列で取得
      const [monthlyOrders, monthlyInvoices, monthlyPayments] = await Promise.all([
        prisma.$queryRaw<Array<{ month: number; count: bigint; total: Prisma.Decimal | null }>>`
          SELECT EXTRACT(MONTH FROM ordered_at)::int AS month, COUNT(*)::bigint AS count, SUM(total_amount) AS total
          FROM orders
          WHERE ordered_at >= ${startDate} AND ordered_at <= ${endDate}
          GROUP BY EXTRACT(MONTH FROM ordered_at)
        `,
        prisma.$queryRaw<Array<{ month: number; count: bigint; total: Prisma.Decimal | null }>>`
          SELECT EXTRACT(MONTH FROM issued_at)::int AS month, COUNT(*)::bigint AS count, SUM(total_amount) AS total
          FROM invoices
          WHERE issued_at >= ${startDate} AND issued_at <= ${endDate}
          GROUP BY EXTRACT(MONTH FROM issued_at)
        `,
        prisma.$queryRaw<Array<{ month: number; count: bigint; total: Prisma.Decimal | null }>>`
          SELECT EXTRACT(MONTH FROM created_at)::int AS month, COUNT(*)::bigint AS count, SUM(amount) AS total
          FROM payments
          WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND status IN ('matched', 'approved')
          GROUP BY EXTRACT(MONTH FROM created_at)
        `,
      ]);

      const orderByMonth = new Map(monthlyOrders.map((r) => [r.month, r]));
      const invoiceByMonth = new Map(monthlyInvoices.map((r) => [r.month, r]));
      const paymentByMonth = new Map(monthlyPayments.map((r) => [r.month, r]));

      for (let m = 1; m <= 12; m++) {
        const o = orderByMonth.get(m);
        const i = invoiceByMonth.get(m);
        const p = paymentByMonth.get(m);
        monthlyData.push({
          month: m,
          orders: o ? Number(o.count) : 0,
          orderAmount: o?.total ? parseFloat(o.total.toString()) : 0,
          invoices: i ? Number(i.count) : 0,
          invoiceAmount: i?.total ? parseFloat(i.total.toString()) : 0,
          payments: p ? Number(p.count) : 0,
          paymentAmount: p?.total ? parseFloat(p.total.toString()) : 0,
        });
      }
    }

    return NextResponse.json({
      period: { year, month },
      summary: {
        totalOrders: orderAgg._count,
        totalOrderAmount: orderAgg._sum.totalAmount ? parseFloat(orderAgg._sum.totalAmount.toString()) : 0,
        totalInvoices: invoiceAgg._count,
        totalInvoiceAmount: invoiceAgg._sum.totalAmount ? parseFloat(invoiceAgg._sum.totalAmount.toString()) : 0,
        totalPayments: paymentAgg._count,
        totalPaymentAmount: paymentAgg._sum.amount ? parseFloat(paymentAgg._sum.amount.toString()) : 0,
        activeMembers,
        activePartners,
      },
      memberStats: memberOrderStats.map((s) => ({
        id: s.memberId,
        name: memberNameMap.get(s.memberId) || '',
        orders: s._count,
        amount: s._sum.totalAmount ? parseFloat(s._sum.totalAmount.toString()) : 0,
      })),
      partnerStats: partnerInvoiceStats.map((s) => ({
        id: s.partnerId,
        name: partnerNameMap.get(s.partnerId) || '',
        invoices: s._count,
        amount: s._sum.totalAmount ? parseFloat(s._sum.totalAmount.toString()) : 0,
      })),
      monthlyData,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
