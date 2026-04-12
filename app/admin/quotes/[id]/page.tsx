'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { QuoteItemsTable } from '@/components/quotes/quote-items-table'
import { ArrowLeft, Calculator, Building2, Loader2, Download } from 'lucide-react'

interface QuoteDetail {
  id: string
  quoteNumber: string
  title: string | null
  description: string | null
  status: string
  totalAmount: string | null
  memberTotalAmount: string | null
  deliveryAddress: string | null
  desiredDate: string | null
  createdAt: string
  approvedAt: string | null
  member: { id: string; name: string }
  user: { id: string; name: string }
  category: { id: string; name: string }
  project: { id: string; projectNumber: string; clientName: string; address: string | null } | null
  items: Array<{
    id: string
    itemName: string
    specification: string | null
    quantity: string | null
    unit: string | null
    unitPrice: string | null
    subtotal: string | null
    memberUnitPrice: string | null
    memberSubtotal: string | null
    status: string | null
    partner: { id: string; name: string }
    product: { id: string; name: string } | null
  }>
  files: Array<{ id: string; fileName: string; fileUrl: string; fileType: string | null }>
}

export default function AdminQuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)

  const fetchQuote = () => {
    fetch(`/api/quotes/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setQuote(data))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchQuote() }, [id])

  const handleRecalculate = async () => {
    setIsCalculating(true)
    try {
      const res = await fetch(`/api/quotes/${id}/calculate`, { method: 'POST' })
      if (res.ok) {
        fetchQuote()
      } else {
        const err = await res.json()
        alert(err.error || 'エラーが発生しました')
      }
    } finally {
      setIsCalculating(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!quote) {
    return <p className="text-center py-12 text-gray-500">見積が見つかりません</p>
  }

  const formatAmount = (v: string | null) => v ? `¥${Number(v).toLocaleString('ja-JP')}` : '-'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/quotes">
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
        {/* 加盟店 */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">加盟店</p>
              <p className="font-medium">{quote.member.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* 金額（原価 + マージン込み） */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-400">原価合計</p>
                <p className="text-lg font-bold">{formatAmount(quote.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">売価合計（マージン込）</p>
                <p className="text-lg font-bold text-blue-600">{formatAmount(quote.memberTotalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 案件情報 */}
        {quote.project && (
          <Link href={`/admin/projects/${quote.project.id}`}>
            <Card className="hover:bg-gray-50">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">案件</p>
                <p className="font-medium">{quote.project.projectNumber} - {quote.project.clientName} 様</p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="カテゴリ" value={quote.category.name} />
            <InfoRow label="依頼者" value={quote.user.name} />
            {quote.deliveryAddress && <InfoRow label="納品先" value={quote.deliveryAddress} />}
            {quote.desiredDate && <InfoRow label="希望納期" value={new Date(quote.desiredDate).toLocaleDateString('ja-JP')} />}
            <InfoRow label="作成日" value={new Date(quote.createdAt).toLocaleDateString('ja-JP')} />
            {quote.approvedAt && <InfoRow label="承認日" value={new Date(quote.approvedAt).toLocaleDateString('ja-JP')} />}
          </CardContent>
        </Card>

        {/* 明細 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">見積明細 ({quote.items.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={isCalculating}>
                {isCalculating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Calculator className="mr-1 h-3 w-3" />}
                再計算
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <QuoteItemsTable items={quote.items} role="admin" />
          </CardContent>
        </Card>

        {/* PDFダウンロード */}
        {['responded', 'approved'].includes(quote.status) && (
          <Button variant="outline" className="w-full min-h-12" asChild>
            <a href={`/api/quotes/${id}/pdf`} download>
              <Download className="mr-2 h-4 w-4" />見積書PDFダウンロード
            </a>
          </Button>
        )}

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
