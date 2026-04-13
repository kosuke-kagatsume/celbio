// カタログ関連の型定義・ユーティリティ

export interface CatalogProduct {
  id: string
  code: string
  name: string
  description: string | null
  unit: string | null
  memberUnitPrice: number
  productType: string
  categoryName: string
  partnerName: string
  specifications: Record<string, string> | null
}

export interface CartItem {
  productId: string
  name: string
  code: string
  unit: string | null
  memberUnitPrice: number
  quantity: number
  partnerName: string
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.memberUnitPrice * item.quantity, 0)
}

export function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

// localStorage キー
export const CART_STORAGE_KEY = 'celbio_cart'

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}
