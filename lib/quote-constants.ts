/** 見積ステータス定義（クライアント/サーバー共通） */
export const QUOTE_STATUSES = {
  draft: '下書き',
  requested: '見積依頼中',
  responded: '回答済',
  approved: '承認済',
  rejected: '却下',
} as const

export type QuoteStatus = keyof typeof QUOTE_STATUSES
