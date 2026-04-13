// 商材関連の型定義・バリデーション

export const PRODUCT_TYPES = {
  TYPE_A: '即発注',
  TYPE_B: '見積必要',
} as const

export type ProductType = keyof typeof PRODUCT_TYPES

export interface ProductCreateInput {
  code: string
  name: string
  categoryId: string
  productType: string
  unit?: string
  unitPrice?: number | null
  description?: string
  specifications?: string
}

export function validateProductInput(data: ProductCreateInput): string | null {
  if (!data.code || !data.name || !data.categoryId || !data.productType) {
    return '必須項目を入力してください（コード、名前、カテゴリ、商品タイプ）'
  }
  if (!['TYPE_A', 'TYPE_B'].includes(data.productType)) {
    return '商品タイプが不正です'
  }
  if (data.productType === 'TYPE_A' && (data.unitPrice == null || data.unitPrice <= 0)) {
    return 'Type A商品は単価が必須です'
  }
  return null
}
