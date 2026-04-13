import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { fetchAllTransactions, parseTransaction } from '@/lib/gmo-aozora'

// GMOあおぞらAPIから取引データを同期
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { dateFrom, dateTo } = body as { dateFrom?: string; dateTo?: string }

    // デフォルト: 今日から7日前まで
    const today = new Date()
    const defaultFrom = new Date(today)
    defaultFrom.setDate(today.getDate() - 7)

    const fromDate = dateFrom || defaultFrom.toISOString().split('T')[0]
    const toDate = dateTo || today.toISOString().split('T')[0]

    // GMO APIから取引取得
    const transactions = await fetchAllTransactions({ dateFrom: fromDate, dateTo: toDate })

    if (transactions.length === 0) {
      return NextResponse.json({ imported: 0, skipped: 0, message: '取引データがありません' })
    }

    // 入金のみ（transactionType = "1"）をフィルタ
    const deposits = transactions.filter((t) => t.transactionType === '1')

    let imported = 0
    let skipped = 0

    for (const txn of deposits) {
      const parsed = parseTransaction(txn)

      // 重複チェック（日付+金額+送金者名）
      const existing = await prisma.bankTransaction.findFirst({
        where: {
          transactionDate: parsed.transactionDate,
          amount: parsed.amount,
          senderName: parsed.senderName,
        },
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.bankTransaction.create({
        data: {
          transactionDate: parsed.transactionDate,
          senderName: parsed.senderName,
          senderNameKana: parsed.senderNameKana,
          amount: parsed.amount,
          balance: parsed.balance,
          description: parsed.description,
          matched: false,
        },
      })
      imported++
    }

    return NextResponse.json({
      imported,
      skipped,
      total: deposits.length,
      dateFrom: fromDate,
      dateTo: toDate,
    })
  } catch (error) {
    console.error('Error syncing bank transactions:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
