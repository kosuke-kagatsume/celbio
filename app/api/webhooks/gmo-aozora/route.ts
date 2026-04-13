import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyBankTransactionSynced } from '@/lib/notifications'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.GMO_AOZORA_WEBHOOK_SECRET || ''

// 署名検証（本番契約後に有効化）
function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true // 未設定時はスキップ（sunabar対応）
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// GMOあおぞらネット銀行からの入金通知Webhook
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // 署名検証
    const signature = request.headers.get('x-gmoa-signature') || ''
    if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      console.error('[GMO Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody) as {
      transactionDate?: string
      amount?: string
      applicantName?: string
      remarks?: string
      balance?: string
      transactionType?: string
    }

    // 入金（transactionType=1）のみ処理
    if (body.transactionType && body.transactionType !== '1') {
      return NextResponse.json({ status: 'skipped', reason: 'not a deposit' })
    }

    const transactionDate = body.transactionDate ? new Date(body.transactionDate) : new Date()
    const amount = Number(body.amount || 0)
    const senderName = body.applicantName || extractSenderFromRemarks(body.remarks || '')
    const balance = body.balance ? Number(body.balance) : null

    // 重複チェック（日付+金額+送金者名）
    const existing = await prisma.bankTransaction.findFirst({
      where: {
        transactionDate,
        amount,
        senderName,
      },
    })

    if (existing) {
      return NextResponse.json({ status: 'skipped', reason: 'duplicate' })
    }

    await prisma.bankTransaction.create({
      data: {
        transactionDate,
        senderName,
        senderNameKana: null,
        amount,
        balance,
        description: body.remarks || null,
        matched: false,
      },
    })

    // 管理者に通知（fire-and-forget）
    notifyBankTransactionSynced(1)

    return NextResponse.json({ status: 'ok', imported: 1 })
  } catch (error) {
    console.error('[GMO Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function extractSenderFromRemarks(remarks: string): string {
  const match = remarks.match(/振込\s+(.+)/)
  return match ? match[1].trim() : remarks || '不明'
}
