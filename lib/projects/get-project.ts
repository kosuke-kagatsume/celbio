import { prisma } from '@/lib/prisma'
import { attachSignedUrls } from '@/lib/file-urls'
import type { AuthUser } from '@/lib/auth'

/**
 * 案件詳細取得（認可+signed URL付与）
 * Server Componentから直接呼び出す。
 * 戻り値: 認可OK & 存在 → project / 認可NG → 'forbidden' / 不在 → null
 */
export async function getProjectForUser(projectId: string, user: AuthUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      member: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, name: true } },
      files: { orderBy: { createdAt: 'desc' } },
      quotes: {
        select: { id: true, quoteNumber: true, status: true, totalAmount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      memberPayments: {
        select: { id: true, amount: true, status: true, paymentType: true, confirmedAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) return null

  if (user.role === 'member' && project.memberId !== user.memberId) {
    return 'forbidden' as const
  }

  const filesWithUrl = await attachSignedUrls(project.files)
  return { ...project, files: filesWithUrl }
}
