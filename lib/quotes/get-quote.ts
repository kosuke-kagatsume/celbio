import { prisma } from '@/lib/prisma'
import { attachSignedUrls } from '@/lib/file-urls'
import type { AuthUser } from '@/lib/auth'

/**
 * 見積詳細取得（認可 + ロール別フィールド隠蔽 + signed URL付与）
 * Server Componentから直接呼ぶ。
 * 戻り値: 認可OK & 存在 → quote / 認可NG → 'forbidden' / 不在 → null
 */
export async function getQuoteForUser(quoteId: string, user: AuthUser) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      member: { select: { id: true, name: true, code: true, address: true, phone: true } },
      user: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, code: true, flowType: true } },
      project: { select: { id: true, projectNumber: true, clientName: true, address: true } },
      items: {
        include: {
          partner: { select: { id: true, name: true, code: true } },
          product: { select: { id: true, name: true, code: true } },
        },
      },
      files: {
        include: {
          uploader: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!quote) return null

  if (user.role === 'member' && quote.memberId !== user.memberId) {
    return 'forbidden' as const
  }

  if (user.role === 'partner') {
    const hasAccess = quote.items.some((item) => item.partnerId === user.partnerId)
    if (!hasAccess) return 'forbidden' as const
  }

  const filesWithUrl = await attachSignedUrls(quote.files)

  // ロール別の価格隠蔽（admin: 全表示 / member: 原価隠す / partner: member価格隠す & 自社明細のみ）
  if (user.role === 'member') {
    return {
      ...quote,
      files: filesWithUrl,
      totalAmount: null,
      items: quote.items.map((item) => ({
        ...item,
        unitPrice: null,
        subtotal: null,
      })),
    }
  }

  if (user.role === 'partner') {
    return {
      ...quote,
      files: filesWithUrl,
      memberTotalAmount: null,
      items: quote.items
        .filter((item) => item.partnerId === user.partnerId)
        .map((item) => ({
          ...item,
          memberUnitPrice: null,
          memberSubtotal: null,
        })),
    }
  }

  return { ...quote, files: filesWithUrl }
}
