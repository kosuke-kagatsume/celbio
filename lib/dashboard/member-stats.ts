import { prisma } from '@/lib/prisma'
import { getCurrentMonthRange, decimalToNumber } from './period'

export interface MemberDashboardStats {
  draftQuotes: number
  pendingQuotes: number
  activeOrders: number
  unpaidInvoices: number
  monthlyOrderAmount: number
  monthlyOrderCount: number
  monthlyPaymentAmount: number
  monthlyPaymentCount: number
}

export async function getMemberDashboardStats(memberId: string): Promise<MemberDashboardStats> {
  const { startOfMonth, endOfMonth } = getCurrentMonthRange()

  const [
    draftQuotes,
    pendingQuotes,
    activeOrders,
    unpaidInvoices,
    monthlyOrders,
    monthlyPayments,
  ] = await Promise.all([
    prisma.quote.count({ where: { memberId, status: 'draft' } }),
    prisma.quote.count({ where: { memberId, status: { in: ['requested', 'responded'] } } }),
    prisma.order.count({ where: { memberId, status: { in: ['ordered', 'confirmed', 'shipped'] } } }),
    prisma.invoice.count({ where: { memberId, status: { in: ['issued', 'sent'] } } }),
    prisma.order.aggregate({
      where: { memberId, orderedAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { totalAmount: true },
      _count: true,
    }),
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
  ])

  return {
    draftQuotes,
    pendingQuotes,
    activeOrders,
    unpaidInvoices,
    monthlyOrderAmount: decimalToNumber(monthlyOrders._sum.totalAmount),
    monthlyOrderCount: monthlyOrders._count,
    monthlyPaymentAmount: decimalToNumber(monthlyPayments._sum.amount),
    monthlyPaymentCount: monthlyPayments._count,
  }
}
