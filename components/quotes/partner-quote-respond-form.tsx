'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'

type Item = {
  id: string
  itemName: string
  specification: string | null
  quantity: string | null
  unit: string | null
  unitPrice: string | null
  subtotal: string | null
  status: string | null
}

type Props = {
  quoteId: string
  items: Item[]
  canRespond: boolean
}

type ItemInput = {
  id: string
  unitPrice: string
  specification: string
}

export function PartnerQuoteRespondForm({ quoteId, items, canRespond }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemInputs, setItemInputs] = useState<ItemInput[]>(
    items.map((item) => ({
      id: item.id,
      unitPrice: item.unitPrice ?? '',
      specification: item.specification ?? '',
    })),
  )

  const updateItemInput = (itemId: string, field: 'unitPrice' | 'specification', value: string) => {
    setItemInputs((prev) => prev.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)))
  }

  const calcSubtotal = (itemId: string): string => {
    const input = itemInputs.find((i) => i.id === itemId)
    const qi = items.find((i) => i.id === itemId)
    if (!input?.unitPrice || !qi?.quantity) return '-'
    return `¥${(parseFloat(input.unitPrice) * parseFloat(qi.quantity)).toLocaleString('ja-JP')}`
  }

  const handleSubmit = async () => {
    const pending = itemInputs.filter((input) => {
      const qi = items.find((i) => i.id === input.id)
      return qi && qi.status !== 'quoted'
    })
    if (pending.some((i) => !i.unitPrice)) {
      alert('全ての明細に単価を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemInputs.map((i) => ({
            id: i.id,
            unitPrice: parseFloat(i.unitPrice),
            specification: i.specification,
          })),
        }),
      })
      if (res.ok) {
        alert('見積回答を送信しました')
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'エラーが発生しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasUnquoted = items.some((i) => i.status !== 'quoted')

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => {
          const input = itemInputs.find((i) => i.id === item.id)
          const isQuoted = item.status === 'quoted'

          return (
            <div key={item.id} className={`border rounded-lg p-4 ${isQuoted ? 'bg-gray-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-sm text-gray-400">
                    数量: {item.quantity ?? '-'} {item.unit ?? ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isQuoted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {isQuoted ? '回答済' : '未回答'}
                </span>
              </div>

              {isQuoted ? (
                <div className="flex flex-wrap gap-4 text-sm">
                  {item.specification && <span className="text-gray-500">仕様: {item.specification}</span>}
                  <span>単価: ¥{Number(item.unitPrice).toLocaleString('ja-JP')}</span>
                  <span className="font-semibold">小計: ¥{Number(item.subtotal).toLocaleString('ja-JP')}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">仕様・備考</label>
                    <Textarea
                      value={input?.specification ?? ''}
                      onChange={(e) => updateItemInput(item.id, 'specification', e.target.value)}
                      placeholder="仕様の詳細や備考"
                      rows={2}
                      className="mt-1 min-h-12"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">単価（税抜）*</label>
                    <Input
                      type="number"
                      value={input?.unitPrice ?? ''}
                      onChange={(e) => updateItemInput(item.id, 'unitPrice', e.target.value)}
                      placeholder="単価を入力"
                      className="mt-1 min-h-12"
                    />
                    <p className="text-xs text-gray-400 mt-1">小計: {calcSubtotal(item.id)}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canRespond && hasUnquoted && (
        <Button className="w-full min-h-12 mt-4" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          見積回答を送信
        </Button>
      )}
    </>
  )
}
