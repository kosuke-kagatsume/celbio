import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/lib/auth'

interface ListQuotesParams {
  user: AuthUser
  status?: string
  page?: number
  limit?: number
}

export interface QuoteListItem {
  id: string
  quoteNumber: string
  title: string | null
  status: string
  totalAmount?: string | null
  memberTotalAmount?: string | null
  createdAt: string
  category: { id: string; name: string }
  member?: { id: string; name: string }
  project?: { id: string; projectNumber: string; clientName: string } | null
}

interface ListResult {
  items: QuoteListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 見積一覧取得（ロール別フィルタ + 価格隠蔽）
 * Server Componentから直接呼び出す。
 */
export async function listQuotesForUser(
  params: ListQuotesParams
): Promise<ListResult> {
  const { user, status } = params
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (user.role === 'member') {
    where.memberId = user.memberId
  } else if (user.role === 'partner') {
    where.items = { some: { partnerId: user.partnerId } }
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
        project: { select: { id: true, projectNumber: true, clientName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.quote.count({ where }),
  ])

  const items: QuoteListItem[] = quotes.map((q) => {
    const base: QuoteListItem = {
      id: q.id,
      quoteNumber: q.quoteNumber,
      title: q.title,
      status: q.status,
      createdAt: q.createdAt.toISOString(),
      category: q.category,
      member: q.member,
      project: q.project,
    }
    // 価格隠蔽（API層と同等のロジック）
    if (user.role === 'member') {
      base.memberTotalAmount = q.memberTotalAmount?.toString() ?? null
    } else if (user.role === 'partner') {
      base.totalAmount = q.totalAmount?.toString() ?? null
    } else {
      base.totalAmount = q.totalAmount?.toString() ?? null
      base.memberTotalAmount = q.memberTotalAmount?.toString() ?? null
    }
    return base
  })

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
