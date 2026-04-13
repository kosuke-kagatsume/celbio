/** 発注ステータス定義（クライアント/サーバー共通） */
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
  draft: ['ordered'],
  ordered: ['confirmed'],
  confirmed: ['shipped'],
  shipped: ['delivered'],
  delivered: ['completed'],
  completed: [],
}

export function isValidOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_TRANSITIONS[current]?.includes(next) ?? false
}
