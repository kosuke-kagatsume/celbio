import { prisma } from '@/lib/prisma'

/** 見積ステータス定義 */
export const QUOTE_STATUSES = {
  draft: '下書き',
  requested: '見積依頼中',
  responded: '回答済',
  approved: '承認済',
  rejected: '却下',
} as const

export type QuoteStatus = keyof typeof QUOTE_STATUSES

/**
 * 見積番号を自動生成（Q{YYYYMMDD}-{NNNN}）
 */
export async function generateQuoteNumber(): Promise<string> {
  const now = new Date()
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')

  const prefix = `Q${dateStr}-`

  const latest = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: 'desc' },
    select: { quoteNumber: true },
  })

  let seq = 1
  if (latest) {
    const lastSeq = parseInt(latest.quoteNumber.split('-')[1], 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}
