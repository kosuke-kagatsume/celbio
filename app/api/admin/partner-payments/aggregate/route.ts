import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { AggregateItem } from '@/lib/partner-payments'

// 月次集計プレビュー（支払データ作成前の確認用）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '')
    if (!year || !month) {
      return NextResponse.json({ error: '対象年月を指定してください' }, { status: 400 })
    }

    // 対象月の未処理請求書をパートナー別に集計
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['issued', 'sent'] },
        issuedAt: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
        partnerPaymentItems: { none: {} },
      },
      include: {
        partner: { select: { id: true, name: true, code: true } },
      },
    })

    // パートナー別集計
    const aggregateMap = new Map<string, AggregateItem>()
    for (const inv of invoices) {
      const existing = aggregateMap.get(inv.partnerId)
      if (existing) {
        existing.invoiceCount += 1
        existing.totalAmount += Number(inv.totalAmount)
      } else {
        aggregateMap.set(inv.partnerId, {
          partnerId: inv.partnerId,
          partnerName: inv.partner.name,
          partnerCode: inv.partner.code,
          invoiceCount: 1,
          totalAmount: Number(inv.totalAmount),
        })
      }
    }

    const items = Array.from(aggregateMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
    const grandTotal = items.reduce((sum, i) => sum + i.totalAmount, 0)

    // 既存の支払データも返す
    const existingPayments = await prisma.partnerPayment.findMany({
      where: { periodYear: year, periodMonth: month },
      include: { partner: { select: { id: true, name: true } } },
    })

    return NextResponse.json({
      items,
      grandTotal,
      invoiceCount: invoices.length,
      partnerCount: items.length,
      existingPayments: existingPayments.map((p) => ({
        id: p.id,
        partnerName: p.partner.name,
        totalAmount: Number(p.totalAmount),
        status: p.status,
      })),
    })
  } catch (error) {
    console.error('Error aggregating partner payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
