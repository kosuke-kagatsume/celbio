/**
 * 当月の期間を取得（dashboard集計で共通利用）
 */
export function getCurrentMonthRange() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { startOfMonth, endOfMonth, year: now.getFullYear(), month: now.getMonth() + 1 }
}

/**
 * Prisma Decimal | null → number
 */
export function decimalToNumber(value: { toString(): string } | null | undefined): number {
  if (value == null) return 0
  return parseFloat(value.toString())
}
