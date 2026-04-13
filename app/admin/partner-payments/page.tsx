'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, ArrowRight, Factory } from 'lucide-react'
import { PAYMENT_STATUSES, type PaymentStatus, type AggregateItem } from '@/lib/partner-payments'
import Link from 'next/link'

interface PartnerPayment {
  id: string
  partnerId: string
  periodYear: number
  periodMonth: number
  totalAmount: string
  status: string
  transferDate: string | null
  transferRef: string | null
  partner: { id: string; name: string; code: string }
  items: { id: string; invoiceId: string; amount: string }[]
}

interface AggregateResult {
  items: AggregateItem[]
  grandTotal: number
  invoiceCount: number
  partnerCount: number
  existingPayments: { id: string; partnerName: string; totalAmount: number; status: string }[]
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export default function PartnerPaymentsPage() {
  const [payments, setPayments] = useState<PartnerPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [aggregate, setAggregate] = useState<AggregateResult | null>(null)
  const [isAggregating, setIsAggregating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [view, setView] = useState<'list' | 'preview'>('list')

  useEffect(() => { fetchPayments() }, [year, month])

  const fetchPayments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/partner-payments?year=${year}&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments)
      }
    } finally { setIsLoading(false) }
  }

  const handlePreview = async () => {
    setIsAggregating(true)
    try {
      const res = await fetch(`/api/admin/partner-payments/aggregate?year=${year}&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setAggregate(data)
        setView('preview')
      }
    } finally { setIsAggregating(false) }
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/partner-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month }),
      })
      if (res.ok) {
        setView('list')
        setAggregate(null)
        fetchPayments()
      }
    } finally { setIsCreating(false) }
  }

  const statusBadge = (status: string) => {
    const info = PAYMENT_STATUSES[status as PaymentStatus]
    if (!info) return <Badge variant="outline">{status}</Badge>
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
    }
    return <Badge className={`${colorMap[info.color]} text-xs`}>{info.label}</Badge>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">支払管理</h1>
        <p className="text-sm text-gray-500 mt-1">メーカー・施工パートナーへの月次支払</p>
      </div>

      {/* 年月選択 */}
      <div className="flex items-center gap-3 mb-6">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="min-h-12 w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="min-h-12 w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>{m}月</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline" className="min-h-12"
          onClick={handlePreview}
          disabled={isAggregating}
        >
          {isAggregating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'プレビュー'}
        </Button>
      </div>

      {/* プレビューモード */}
      {view === 'preview' && aggregate && (
        <div className="mb-6 space-y-4">
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="font-bold mb-2">{year}年{month}月 集計プレビュー</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold">{aggregate.partnerCount}</p>
                <p className="text-xs text-gray-600">対象パートナー</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{aggregate.invoiceCount}</p>
                <p className="text-xs text-gray-600">請求書数</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">¥{aggregate.grandTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-600">合計金額</p>
              </div>
            </div>

            {aggregate.items.length > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {aggregate.items.map((item) => (
                    <div key={item.partnerId} className="bg-white rounded p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.partnerName}</p>
                        <p className="text-xs text-gray-500">{item.partnerCode} / {item.invoiceCount}件</p>
                      </div>
                      <p className="font-bold">¥{item.totalAmount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full min-h-12" onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />作成中...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" />支払データを作成</>
                  )}
                </Button>
              </>
            ) : (
              <p className="text-center text-gray-500 py-4">未処理の請求書がありません</p>
            )}

            {aggregate.existingPayments.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 rounded">
                <p className="text-xs text-yellow-700 font-medium mb-1">既存の支払データ:</p>
                {aggregate.existingPayments.map((p) => (
                  <p key={p.id} className="text-xs text-yellow-600">
                    {p.partnerName}: ¥{p.totalAmount.toLocaleString()} ({p.status})
                  </p>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" className="min-h-10" onClick={() => setView('list')}>
            一覧に戻る
          </Button>
        </div>
      )}

      {/* 支払一覧 */}
      {view === 'list' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : payments.length === 0 ? (
            <p className="text-center text-gray-400 py-12">{year}年{month}月の支払データはありません</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <Link key={p.id} href={`/admin/partner-payments/${p.id}`}>
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{p.partner.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.partner.code}</span>
                      </div>
                      {statusBadge(p.status)}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-500">
                        {p.items.length}件の請求書
                        {p.transferDate && ` / 振込日: ${new Date(p.transferDate).toLocaleDateString('ja-JP')}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">¥{Number(p.totalAmount).toLocaleString()}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
