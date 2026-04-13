// メーカー・施工パートナー支払い関連のロジック

export const PAYMENT_STATUSES = {
  pending: { label: '承認待ち', color: 'yellow' },
  approved: { label: '承認済み', color: 'blue' },
  transferred: { label: '振込済み', color: 'green' },
  completed: { label: '完了', color: 'gray' },
} as const

export type PaymentStatus = keyof typeof PAYMENT_STATUSES

// ステータス遷移ルール
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved'],
  approved: ['transferred'],
  transferred: ['completed'],
}

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextStatus(current: string): string | null {
  const transitions = VALID_TRANSITIONS[current]
  return transitions?.[0] ?? null
}

export interface AggregateItem {
  partnerId: string
  partnerName: string
  partnerCode: string
  invoiceCount: number
  totalAmount: number
}
