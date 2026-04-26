import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/lib/auth'

interface ListPartnerQuotesParams {
  user: AuthUser
  status?: string
  page?: number
  limit?: number
}

export interface PartnerQuoteListItem {
  id: string
  quoteNumber: string
  title: string | null
  status: string
  totalAmount: string | null
  createdAt: string
  desiredDate: string | null
  category: { id: string; name: string }
  member: { id: string; name: string }
  items: Array<{ id: string; status: string | null }>
}

interface ListResult {
  items: PartnerQuoteListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * メーカー（partner）向け見積一覧取得。
 * 自社が関係する見積のみ、自社items情報を含む（pendingCount計算用）。
 */
export async function listPartnerQuotes(
  params: ListPartnerQuotesParams
): Promise<ListResult> {
  const { user, status } = params
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  if (user.role !== 'partner' || !user.partnerId) {
    return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } }
  }

  const where: Record<string, unknown> = {
    items: { some: { partnerId: user.partnerId } },
  }
  if (status) {
    where.status = status
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        member: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        items: {
          where: { partnerId: user.partnerId },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.quote.count({ where }),
  ])

  const items: PartnerQuoteListItem[] = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    title: q.title,
    status: q.status,
    totalAmount: q.totalAmount?.toString() ?? null,
    createdAt: q.createdAt.toISOString(),
    desiredDate: q.desiredDate ? q.desiredDate.toISOString() : null,
    category: q.category,
    member: q.member,
    items: q.items,
  }))

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
