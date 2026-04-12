'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'

interface QuoteItem {
  id: string
  itemName: string
  specification: string | null
  quantity: string | null
  unit: string | null
  unitPrice: string | null
  subtotal: string | null
  status: string | null
  partner: { id: string; name: string }
}

interface QuoteDetail {
  id: string
  quoteNumber: string
  title: string | null
  description: string | null
  status: string
  totalAmount: string | null
  deliveryAddress: string | null
  desiredDate: string | null
  createdAt: string
  member: { id: string; name: string }
  user: { id: string; name: string }
  category: { id: string; name: string }
  items: QuoteItem[]
  files: Array<{ id: string; fileName: string; fileUrl: string; fileType: string | null }>
}

interface ItemInput {
  id: string
  unitPrice: string
  specification: string
}

export default function PartnerQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemInputs, setItemInputs] = useState<ItemInput[]>([])

  useEffect(() => { fetchQuote() }, [id])

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/quotes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setQuote(data)
        setItemInputs(data.items.map((item: QuoteItem) => ({
          id: item.id,
          unitPrice: item.unitPrice || '',
          specification: item.specification || '',
        })))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateItemInput = (itemId: string, field: 'unitPrice' | 'specification', value: string) => {
    setItemInputs((prev) => prev.map((i) => i.id === itemId ? { ...i, [field]: value } : i))
  }

  const handleSubmit = async () => {
    const pending = itemInputs.filter((input) => {
      const qi = quote?.items.find((i) => i.id === input.id)
      return qi && qi.status !== 'quoted'
    })
    if (pending.some((i) => !i.unitPrice)) {
      alert('全ての明細に単価を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quotes/${id}/respond`, {
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
        fetchQuote()
      } else {
        const err = await res.json()
        alert(err.error || 'エラーが発生しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const calcSubtotal = (itemId: string): string => {
    const input = itemInputs.find((i) => i.id === itemId)
    const qi = quote?.items.find((i) => i.id === itemId)
    if (!input?.unitPrice || !qi?.quantity) return '-'
    return `¥${(parseFloat(input.unitPrice) * parseFloat(qi.quantity)).toLocaleString('ja-JP')}`
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!quote) {
    return <p className="text-center py-12 text-gray-500">見積が見つかりません</p>
  }

  const canRespond = quote.status === 'requested'
  const hasUnquoted = quote.items.some((i) => i.status !== 'quoted')

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/partner/quotes">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">{quote.quoteNumber}</span>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <h1 className="text-xl font-bold mt-1">{quote.title ?? quote.category.name}</h1>
        </div>
      </div>

      <div className="space-y-4">
        {/* 依頼元 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">依頼元情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="加盟店" value={quote.member.name} />
            <InfoRow label="担当者" value={quote.user.name} />
            <InfoRow label="カテゴリ" value={quote.category.name} />
            {quote.deliveryAddress && <InfoRow label="納品先" value={quote.deliveryAddress} />}
            {quote.desiredDate && <InfoRow label="希望納期" value={new Date(quote.desiredDate).toLocaleDateString('ja-JP')} />}
            <InfoRow label="依頼日" value={new Date(quote.createdAt).toLocaleDateString('ja-JP')} />
            {quote.description && (
              <div>
                <p className="text-sm text-gray-400 mb-1">依頼内容</p>
                <p className="text-sm whitespace-pre-wrap">{quote.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 明細・回答入力 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">見積明細 ({quote.items.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {quote.items.map((item) => {
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
          </CardContent>
        </Card>

        {/* 添付ファイル */}
        {quote.files.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">添付ファイル</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quote.files.map((f) => (
                <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                   className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm text-blue-600">
                  {f.fileName}
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 回答ボタン */}
        {canRespond && hasUnquoted && (
          <Button className="w-full min-h-12" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            見積回答を送信
          </Button>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-sm text-gray-400 shrink-0 w-20">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  )
}
