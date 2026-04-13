import { prisma } from '@/lib/prisma'

// 定数・型はクライアントでも使えるようにquote-constants.tsに分離
export { QUOTE_STATUSES } from '@/lib/quote-constants'
export type { QuoteStatus } from '@/lib/quote-constants'

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
