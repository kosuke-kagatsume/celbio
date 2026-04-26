import { prisma } from '@/lib/prisma'
import { getCurrentMonthRange, decimalToNumber } from './period'

export interface PartnerDashboardStats {
  pendingQuotes: number
  pendingOrders: number
  shippedOrders: number
  unpaidInvoices: number
  monthlyInvoiceAmount: number
  monthlyInvoiceCount: number
  monthlyPaymentAmount: number
  monthlyPaymentCount: number
}

export async function getPartnerDashboardStats(partnerId: string): Promise<PartnerDashboardStats> {
  const { startOfMonth, endOfMonth } = getCurrentMonthRange()

  const [
    pendingQuotes,
    pendingOrders,
    shippedOrders,
    unpaidInvoices,
    monthlyInvoices,
    monthlyPayments,
  ] = await Promise.all([
    prisma.quoteItem.count({
      where: {
        partnerId,
        quote: { status: { in: ['requested'] } },
        quotedAt: null,
      },
    }),
    prisma.orderItem.count({
      where: { partnerId, status: { in: ['pending', 'confirmed'] } },
    }),
    prisma.orderItem.count({
      where: { partnerId, status: 'shipped' },
    }),
    prisma.invoice.count({
      where: { partnerId, status: { in: ['issued', 'sent'] } },
    }),
    prisma.invoice.aggregate({
      where: { partnerId, issuedAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ['matched', 'approved'] },
        invoice: { partnerId },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return {
    pendingQuotes,
    pendingOrders,
    shippedOrders,
    unpaidInvoices,
    monthlyInvoiceAmount: decimalToNumber(monthlyInvoices._sum.totalAmount),
    monthlyInvoiceCount: monthlyInvoices._count,
    monthlyPaymentAmount: decimalToNumber(monthlyPayments._sum.amount),
    monthlyPaymentCount: monthlyPayments._count,
  }
}
