import { prisma } from '@/lib/prisma'

// 定数・型はクライアントでも使える��うにorder-constants.tsに分離
export { ORDER_STATUSES, isValidOrderTransition } from '@/lib/order-constants'
export type { OrderStatus } from '@/lib/order-constants'

/**
 * 発注番号を自動生成（O{YYYYMMDD}-{NNNN}）
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date()
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')

  const prefix = `O${dateStr}-`

  const latest = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  })

  let seq = 1
  if (latest) {
    const lastSeq = parseInt(latest.orderNumber.split('-')[1], 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}

/**
 * 前入金ゲートチェック
 * 案件の入金が確認済みかどうかを判定
 */
export async function checkPaymentGate(projectId: string): Promise<{
  passed: boolean
  paymentConfirmedAt: Date | null
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { paymentConfirmedAt: true },
  })

  return {
    passed: project?.paymentConfirmedAt != null,
    paymentConfirmedAt: project?.paymentConfirmedAt ?? null,
  }
}
