import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// ダッシュボード統計取得
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (user.role === 'admin') {
      // 管理者ダッシュボード
      const [
        pendingQuotes,
        activeOrders,
        unpaidInvoices,
        pendingPayments,
        monthlyOrders,
        monthlyPayments,
        members,
        partners,
      ] = await Promise.all([
        // 承認待ち見積
        prisma.quote.count({ where: { status: 'requested' } }),
        // 進行中の発注
        prisma.order.count({ where: { status: { in: ['ordered', 'confirmed', 'shipped'] } } }),
        // 未払い請求書
        prisma.invoice.count({ where: { status: { in: ['issued', 'sent'] } } }),
        // 承認待ち入金
        prisma.payment.count({ where: { status: 'pending' } }),
        // 今月の発注
        prisma.order.aggregate({
          where: { orderedAt: { gte: startOfMonth, lte: endOfMonth } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        // 今月の入金
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
            status: { in: ['matched', 'approved'] },
          },
          _sum: { amount: true },
          _count: true,
        }),
        // アクティブ加盟店数
        prisma.member.count({ where: { isActive: true } }),
        // アクティブメーカー数
        prisma.partner.count({ where: { isActive: true } }),
      ]);

      return NextResponse.json({
        pendingQuotes,
        activeOrders,
        unpaidInvoices,
        pendingPayments,
        monthlyOrderAmount: monthlyOrders._sum.totalAmount ? parseFloat(monthlyOrders._sum.totalAmount.toString()) : 0,
        monthlyOrderCount: monthlyOrders._count,
        monthlyPaymentAmount: monthlyPayments._sum.amount ? parseFloat(monthlyPayments._sum.amount.toString()) : 0,
        monthlyPaymentCount: monthlyPayments._count,
        members,
        partners,
      });
    } else if (user.role === 'member') {
      // 加盟店ダッシュボード
      if (!user.memberId) {
        return NextResponse.json({ error: 'Member ID not found' }, { status: 403 });
      }
      const memberId = user.memberId;

      const [
        draftQuotes,
        pendingQuotes,
        activeOrders,
        unpaidInvoices,
        monthlyOrders,
        monthlyPayments,
      ] = await Promise.all([
        // 下書き見積
        prisma.quote.count({ where: { memberId, status: 'draft' } }),
        // 回答待ち見積
        prisma.quote.count({ where: { memberId, status: { in: ['requested', 'responded'] } } }),
        // 進行中の発注
        prisma.order.count({ where: { memberId, status: { in: ['ordered', 'confirmed', 'shipped'] } } }),
        // 未払い請求書
        prisma.invoice.count({ where: { memberId, status: { in: ['issued', 'sent'] } } }),
        // 今月の発注
        prisma.order.aggregate({
          where: { memberId, orderedAt: { gte: startOfMonth, lte: endOfMonth } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        // 今月の支払い
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
            status: { in: ['matched', 'approved'] },
            OR: [
              { invoice: { memberId } },
              { bundle: { memberId } },
            ],
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      return NextResponse.json({
        draftQuotes,
        pendingQuotes,
        activeOrders,
        unpaidInvoices,
        monthlyOrderAmount: monthlyOrders._sum.totalAmount ? parseFloat(monthlyOrders._sum.totalAmount.toString()) : 0,
        monthlyOrderCount: monthlyOrders._count,
        monthlyPaymentAmount: monthlyPayments._sum.amount ? parseFloat(monthlyPayments._sum.amount.toString()) : 0,
        monthlyPaymentCount: monthlyPayments._count,
      });
    } else if (user.role === 'partner') {
      // メーカーダッシュボード
      if (!user.partnerId) {
        return NextResponse.json({ error: 'Partner ID not found' }, { status: 403 });
      }
      const partnerId = user.partnerId;

      const [
        pendingQuotes,
        pendingOrders,
        shippedOrders,
        unpaidInvoices,
        monthlyInvoices,
        monthlyPayments,
      ] = await Promise.all([
        // 回答待ち見積
        prisma.quoteItem.count({
          where: {
            partnerId,
            quote: { status: { in: ['requested'] } },
            quotedAt: null,
          },
        }),
        // 出荷待ち発注
        prisma.orderItem.count({
          where: { partnerId, status: { in: ['pending', 'confirmed'] } },
        }),
        // 出荷済み（納品待ち）
        prisma.orderItem.count({
          where: { partnerId, status: 'shipped' },
        }),
        // 未入金請求書
        prisma.invoice.count({
          where: { partnerId, status: { in: ['issued', 'sent'] } },
        }),
        // 今月の請求
        prisma.invoice.aggregate({
          where: {
            partnerId,
            issuedAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        // 今月の入金
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
            status: { in: ['matched', 'approved'] },
            invoice: { partnerId },
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      return NextResponse.json({
        pendingQuotes,
        pendingOrders,
        shippedOrders,
        unpaidInvoices,
        monthlyInvoiceAmount: monthlyInvoices._sum.totalAmount ? parseFloat(monthlyInvoices._sum.totalAmount.toString()) : 0,
        monthlyInvoiceCount: monthlyInvoices._count,
        monthlyPaymentAmount: monthlyPayments._sum.amount ? parseFloat(monthlyPayments._sum.amount.toString()) : 0,
        monthlyPaymentCount: monthlyPayments._count,
      });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
