import { prisma } from '@/lib/prisma'

// ============================================
// マージン計算エンジン
// 計算式: ROUNDUP(原価 / costRatio, roundingUnit) + fixedAddition
// 適用優先順位: 品目(Product) → カテゴリ → パートナー×カテゴリ → デフォルト
// ============================================

interface MarginRateRecord {
  costRatio: { toString(): string }
  fixedAddition: { toString(): string }
  roundingUnit: number
  description: string | null
}

interface MarginCalcResult {
  /** 原価 */
  cost: number
  /** マージン込み単価 */
  memberPrice: number
  /** 適用されたマージン係数の説明 */
  appliedRule: string | null
}

/**
 * 丸め単位に従って切り上げ
 * roundingUnit: -3 → 千円単位切り上げ, -4 → 万円単位切り上げ
 * 例: roundUp(143500, -3) → 144000
 * 例: roundUp(143500, -4) → 150000
 */
export function roundUp(value: number, roundingUnit: number): number {
  // roundingUnit が負の場合: -3 → 1000, -4 → 10000
  const unit = Math.pow(10, Math.abs(roundingUnit))
  return Math.ceil(value / unit) * unit
}

/**
 * マージン込み単価を計算
 * ROUNDUP(原価 / costRatio, roundingUnit) + fixedAddition
 */
export function calculateMemberPrice(
  cost: number,
  costRatio: number,
  roundingUnit: number,
  fixedAddition: number
): number {
  if (costRatio <= 0) return cost
  const divided = cost / costRatio
  const rounded = roundUp(divided, roundingUnit)
  return rounded + fixedAddition
}

/**
 * 適用可能なマージン係数を検索（優先順位順）
 * 1. 品目（productId）指定
 * 2. カテゴリ指定（パートナー指定なし）
 * 3. パートナー×カテゴリ指定
 * 4. デフォルト（全てnull）
 */
export async function findApplicableMarginRate(params: {
  partnerId: string
  categoryId: string
  productId?: string | null
  itemType?: string
}): Promise<MarginRateRecord | null> {
  const { partnerId, categoryId, productId, itemType = 'material' } = params

  // 全候補を一括取得して優先順位で選択（N+1回避）
  const candidates = await prisma.marginRate.findMany({
    where: {
      isActive: true,
      itemType,
      OR: [
        // 品目指定（最優先）
        ...(productId ? [{ productId, partnerId, categoryId }] : []),
        // カテゴリ指定（パートナー問わず）
        { categoryId, partnerId: null, productId: null },
        // パートナー×カテゴリ
        { partnerId, categoryId, productId: null },
        // デフォルト
        { partnerId: null, categoryId: null, productId: null },
      ],
    },
  })

  // 優先順位でソート: productId有 > partnerId+categoryId > categoryId > デフォルト
  const sorted = candidates.sort((a, b) => {
    const scoreA = (a.productId ? 8 : 0) + (a.partnerId ? 2 : 0) + (a.categoryId ? 1 : 0)
    const scoreB = (b.productId ? 8 : 0) + (b.partnerId ? 2 : 0) + (b.categoryId ? 1 : 0)
    return scoreB - scoreA
  })

  return sorted[0] ?? null
}

/**
 * 見積明細1行のマージン込み単価を計算
 */
export async function calcItemMemberPrice(params: {
  partnerId: string
  categoryId: string
  productId?: string | null
  itemType?: string
  unitPrice: number
}): Promise<MarginCalcResult> {
  const { unitPrice, ...searchParams } = params

  const rate = await findApplicableMarginRate(searchParams)

  if (!rate) {
    // マージン係数が未設定 → 原価をそのまま返す
    return { cost: unitPrice, memberPrice: unitPrice, appliedRule: null }
  }

  const costRatio = Number(rate.costRatio)
  const fixedAddition = Number(rate.fixedAddition)
  const memberPrice = calculateMemberPrice(unitPrice, costRatio, rate.roundingUnit, fixedAddition)

  return {
    cost: unitPrice,
    memberPrice,
    appliedRule: rate.description,
  }
}

/**
 * 見積全体のマージン計算を実行し、DBを更新
 */
export async function calculateQuoteMargins(quoteId: string): Promise<{
  totalAmount: number
  memberTotalAmount: number
  itemCount: number
}> {
  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      items: { include: { partner: true } },
    },
  })

  let totalAmount = 0
  let memberTotalAmount = 0
  let itemCount = 0

  for (const item of quote.items) {
    if (item.unitPrice == null || item.quantity == null) continue

    const unitPrice = Number(item.unitPrice)
    const quantity = Number(item.quantity)
    const subtotal = unitPrice * quantity

    const result = await calcItemMemberPrice({
      partnerId: item.partnerId,
      categoryId: quote.categoryId,
      productId: item.productId,
      itemType: item.itemType,
      unitPrice,
    })

    const memberSubtotal = result.memberPrice * quantity

    await prisma.quoteItem.update({
      where: { id: item.id },
      data: {
        subtotal: subtotal,
        memberUnitPrice: result.memberPrice,
        memberSubtotal: memberSubtotal,
      },
    })

    totalAmount += subtotal
    memberTotalAmount += memberSubtotal
    itemCount++
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      totalAmount,
      memberTotalAmount,
    },
  })

  return { totalAmount, memberTotalAmount, itemCount }
}
