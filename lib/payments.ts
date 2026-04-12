/** 入金ステータス定義 */
export const PAYMENT_STATUSES = {
  pending: '確認待ち',
  confirmed: '確認済',
  refunded: '返金済',
} as const

export type PaymentStatus = keyof typeof PAYMENT_STATUSES

/** 入金種別定義 */
export const PAYMENT_TYPES = {
  prepayment: '前入金',
  postpayment: '後払い',
} as const

export type PaymentType = keyof typeof PAYMENT_TYPES
