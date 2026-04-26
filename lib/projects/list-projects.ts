import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/lib/auth'

interface ListProjectsParams {
  user: AuthUser
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface ProjectListItem {
  id: string
  projectNumber: string
  clientName: string
  address: string | null
  status: string
  createdAt: string
  member: { id: string; name: string }
  _count: { quotes: number; orders: number; files: number }
}

export interface ListResult<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 案件一覧取得（ロール別フィルタ）
 * Server Componentから直接呼び出す。
 */
export async function listProjectsForUser(
  params: ListProjectsParams
): Promise<ListResult<ProjectListItem>> {
  const { user, status, search } = params
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (user.role === 'member' && user.memberId) {
    where.memberId = user.memberId
  }
  if (status) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { projectNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        member: { select: { id: true, name: true } },
        _count: { select: { quotes: true, orders: true, files: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ])

  const items: ProjectListItem[] = projects.map((p) => ({
    id: p.id,
    projectNumber: p.projectNumber,
    clientName: p.clientName,
    address: p.address,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    member: p.member,
    _count: p._count,
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
