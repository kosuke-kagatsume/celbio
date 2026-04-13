'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/components/catalog/cart-provider'
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [desiredDate, setDesiredDate] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      setError('配送先を入力してください')
      return
    }
    if (items.length === 0) {
      setError('カートが空です')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/member/catalog/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: deliveryAddress.trim(),
          desiredDate: desiredDate || undefined,
          note: note.trim() || undefined,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '発注に失敗しました')
        return
      }

      const data = await res.json()
      clearCart()
      router.push(`/member/orders?created=${data.orderNumber}`)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/member/catalog" className="inline-flex items-center text-sm text-blue-600 mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          カタログに戻る
        </Link>
        <h1 className="text-2xl font-bold">カート</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">カートに商品がありません</p>
          <Link href="/member/catalog">
            <Button variant="outline" className="min-h-12">カタログを見る</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* カート商品一覧 */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.code}</p>
                    <p className="text-xs text-gray-500">{item.partnerName}</p>
                    <p className="text-sm font-bold mt-1">
                      ¥{item.memberUnitPrice.toLocaleString()}
                      {item.unit && <span className="text-xs font-normal text-gray-500"> /{item.unit}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-right text-sm font-bold mt-2">
                  小計: ¥{(item.memberUnitPrice * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* 合計 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium">合計（税抜）</span>
              <span className="text-xl font-bold">¥{total.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ※ 最終価格はサーバー側で再計算されます
            </p>
          </div>

          {/* 配送情報 */}
          <div className="space-y-4">
            <h2 className="font-bold">配送情報</h2>
            <div>
              <label className="text-sm font-medium mb-1 block">
                配送先住所 <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="配送先の住所を入力"
                className="min-h-20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">希望納期</label>
              <Input
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                className="min-h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">備考</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="連絡事項があれば入力"
                className="min-h-20"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}

          {/* 発注ボタン */}
          <Button
            className="w-full min-h-14 text-lg"
            disabled={isSubmitting}
            onClick={handleCheckout}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />発注中...</>
            ) : (
              <>注文を確定する（¥{total.toLocaleString()}）</>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            発注後、前入金の確認が取れ次第メーカーへ発注されます
          </p>
        </div>
      )}
    </div>
  )
}
