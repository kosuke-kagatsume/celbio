import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

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

    // 並列でデータ取得
    const [
      orders,
      invoices,
      payments,
      members,
      partners,
    ] = await Promise.all([
      // 発注データ
      prisma.order.findMany({
        where: {
          orderedAt: { gte: startDate, lte: endDate },
        },
        include: {
          member: { select: { id: true, name: true } },
        },
      }),
      // 請求書データ
      prisma.invoice.findMany({
        where: {
          issuedAt: { gte: startDate, lte: endDate },
        },
        include: {
          partner: { select: { id: true, name: true } },
          member: { select: { id: true, name: true } },
        },
      }),
      // 入金データ
      prisma.payment.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['matched', 'approved'] },
        },
        include: {
          invoice: {
            include: {
              member: { select: { id: true, name: true } },
              partner: { select: { id: true, name: true } },
            },
          },
          bundle: {
            include: {
              member: { select: { id: true, name: true } },
            },
          },
        },
      }),
      // 加盟店数
      prisma.member.count({ where: { isActive: true } }),
      // メーカー数
      prisma.partner.count({ where: { isActive: true } }),
    ]);

    // 集計
    const totalOrders = orders.length;
    const totalOrderAmount = orders.reduce(
      (sum, o) => sum + parseFloat(o.totalAmount.toString()),
      0
    );

    const totalInvoices = invoices.length;
    const totalInvoiceAmount = invoices.reduce(
      (sum, i) => sum + parseFloat(i.totalAmount.toString()),
      0
    );

    const totalPayments = payments.length;
    const totalPaymentAmount = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );

    // 加盟店別集計
    const memberStats = new Map<string, { name: string; orders: number; amount: number; payments: number }>();
    orders.forEach((o) => {
      const key = o.member.id;
      const current = memberStats.get(key) || { name: o.member.name, orders: 0, amount: 0, payments: 0 };
      current.orders++;
      current.amount += parseFloat(o.totalAmount.toString());
      memberStats.set(key, current);
    });
    payments.forEach((p) => {
      const memberId = p.invoice?.member?.id || p.bundle?.member?.id;
      const memberName = p.invoice?.member?.name || p.bundle?.member?.name;
      if (memberId && memberName) {
        const current = memberStats.get(memberId) || { name: memberName, orders: 0, amount: 0, payments: 0 };
        current.payments += parseFloat(p.amount.toString());
        memberStats.set(memberId, current);
      }
    });

    // メーカー別集計
    const partnerStats = new Map<string, { name: string; invoices: number; amount: number }>();
    invoices.forEach((i) => {
      const key = i.partner.id;
      const current = partnerStats.get(key) || { name: i.partner.name, invoices: 0, amount: 0 };
      current.invoices++;
      current.amount += parseFloat(i.totalAmount.toString());
      partnerStats.set(key, current);
    });

    // 月別推移（年間表示の場合）
    const monthlyData = [];
    if (!month) {
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(year, m, 1);
        const mEnd = new Date(year, m + 1, 0, 23, 59, 59);

        const mOrders = orders.filter((o) => {
          const d = new Date(o.orderedAt!);
          return d >= mStart && d <= mEnd;
        });
        const mInvoices = invoices.filter((i) => {
          const d = new Date(i.issuedAt!);
          return d >= mStart && d <= mEnd;
        });
        const mPayments = payments.filter((p) => {
          const d = new Date(p.createdAt);
          return d >= mStart && d <= mEnd;
        });

        monthlyData.push({
          month: m + 1,
          orders: mOrders.length,
          orderAmount: mOrders.reduce((s, o) => s + parseFloat(o.totalAmount.toString()), 0),
          invoices: mInvoices.length,
          invoiceAmount: mInvoices.reduce((s, i) => s + parseFloat(i.totalAmount.toString()), 0),
          payments: mPayments.length,
          paymentAmount: mPayments.reduce((s, p) => s + parseFloat(p.amount.toString()), 0),
        });
      }
    }

    return NextResponse.json({
      period: { year, month },
      summary: {
        totalOrders,
        totalOrderAmount,
        totalInvoices,
        totalInvoiceAmount,
        totalPayments,
        totalPaymentAmount,
        activeMembers: members,
        activePartners: partners,
      },
      memberStats: Array.from(memberStats.entries()).map(([id, data]) => ({
        id,
        ...data,
      })),
      partnerStats: Array.from(partnerStats.entries()).map(([id, data]) => ({
        id,
        ...data,
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
