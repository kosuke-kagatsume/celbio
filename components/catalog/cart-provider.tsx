'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type CartItem, loadCart, saveCart } from '@/lib/catalog'

interface CartContextValue {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => { setItems(loadCart()) }, [])

  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems)
    saveCart(newItems)
  }, [])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      const newItems = existing
        ? prev.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { ...item, quantity }]
      saveCart(newItems)
      return newItems
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.productId !== productId)
      saveCart(newItems)
      return newItems
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId)
    setItems((prev) => {
      const newItems = prev.map((i) => i.productId === productId ? { ...i, quantity } : i)
      saveCart(newItems)
      return newItems
    })
  }, [removeFromCart])

  const clearCart = useCallback(() => persist([]), [persist])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.memberUnitPrice * i.quantity, 0)

  return (
    <CartContext value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, total }}>
      {children}
    </CartContext>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
