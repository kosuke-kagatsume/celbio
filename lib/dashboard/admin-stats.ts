import { prisma } from '@/lib/prisma'
import { getCurrentMonthRange, decimalToNumber } from './period'

export interface AdminDashboardStats {
  pendingQuotes: number
  activeOrders: number
  unpaidInvoices: number
  pendingPayments: number
  monthlyOrderAmount: number
  monthlyOrderCount: number
  monthlyPaymentAmount: number
  monthlyPaymentCount: number
  members: number
  partners: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { startOfMonth, endOfMonth } = getCurrentMonthRange()

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
    prisma.quote.count({ where: { status: 'requested' } }),
    prisma.order.count({ where: { status: { in: ['ordered', 'confirmed', 'shipped'] } } }),
    prisma.invoice.count({ where: { status: { in: ['issued', 'sent'] } } }),
    prisma.payment.count({ where: { status: 'pending' } }),
    prisma.order.aggregate({
      where: { orderedAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ['matched', 'approved'] },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.member.count({ where: { isActive: true } }),
    prisma.partner.count({ where: { isActive: true } }),
  ])

  return {
    pendingQuotes,
    activeOrders,
    unpaidInvoices,
    pendingPayments,
    monthlyOrderAmount: decimalToNumber(monthlyOrders._sum.totalAmount),
    monthlyOrderCount: monthlyOrders._count,
    monthlyPaymentAmount: decimalToNumber(monthlyPayments._sum.amount),
    monthlyPaymentCount: monthlyPayments._count,
    members,
    partners,
  }
}
