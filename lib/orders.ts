import { prisma } from '@/lib/prisma'

/** 発注ステータス定義 */
export const ORDER_STATUSES = {
  draft: '下書き（入金待ち）',
  ordered: '発注済',
  confirmed: '受注確認済',
  shipped: '出荷済',
  delivered: '納品済',
  completed: '完了',
} as const

export type OrderStatus = keyof typeof ORDER_STATUSES

/** ステータス遷移ルール */
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['ordered'],         // 入金確認後に発注可能
  ordered: ['confirmed'],     // メーカーが受注確認
  confirmed: ['shipped'],     // メーカーが出荷報告
  shipped: ['delivered'],     // 納品確認
  delivered: ['completed'],   // 完了
  completed: [],
}

export function isValidOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_TRANSITIONS[current]?.includes(next) ?? false
}

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
