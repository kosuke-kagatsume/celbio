import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 支払一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (year) where.periodYear = year
    if (month) where.periodMonth = month
    if (status) where.status = status

    const payments = await prisma.partnerPayment.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            invoice: {
              select: { id: true, invoiceNumber: true, amount: true, totalAmount: true, issuedAt: true },
            },
          },
        },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching partner payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 支払データ作成（月次集計結果から）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { year, month } = await request.json()
    if (!year || !month) {
      return NextResponse.json({ error: '対象年月を指定してください' }, { status: 400 })
    }

    // 対象月の請求書を集計（メーカー/施工パートナーが発行した請求書で、まだ支払データに含まれていないもの）
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

    if (invoices.length === 0) {
      return NextResponse.json({ error: '対象期間に未処理の請求書がありません' }, { status: 400 })
    }

    // パートナー別にグループ化
    const grouped = new Map<string, typeof invoices>()
    for (const inv of invoices) {
      const list = grouped.get(inv.partnerId) || []
      list.push(inv)
      grouped.set(inv.partnerId, list)
    }

    // トランザクションで支払データ作成
    const created = await prisma.$transaction(async (tx) => {
      const results = []
      for (const [partnerId, partnerInvoices] of grouped) {
        const totalAmount = partnerInvoices.reduce(
          (sum, inv) => sum + Number(inv.totalAmount), 0
        )

        // 既に同月の支払データがある場合はスキップ
        const existing = await tx.partnerPayment.findUnique({
          where: { partnerId_periodYear_periodMonth: { partnerId, periodYear: year, periodMonth: month } },
        })
        if (existing) continue

        const payment = await tx.partnerPayment.create({
          data: {
            partnerId,
            periodYear: year,
            periodMonth: month,
            totalAmount,
            status: 'pending',
            items: {
              create: partnerInvoices.map((inv) => ({
                invoiceId: inv.id,
                amount: inv.totalAmount,
              })),
            },
          },
          include: {
            partner: { select: { id: true, name: true } },
            items: true,
          },
        })
        results.push(payment)
      }
      return results
    })

    return NextResponse.json({ created, count: created.length }, { status: 201 })
  } catch (error) {
    console.error('Error creating partner payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
