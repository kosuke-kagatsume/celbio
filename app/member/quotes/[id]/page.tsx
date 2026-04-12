'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { QuoteItemsTable } from '@/components/quotes/quote-items-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Send, CheckCircle, Loader2, Download } from 'lucide-react'

interface QuoteDetail {
  id: string
  quoteNumber: string
  title: string | null
  description: string | null
  status: string
  memberTotalAmount: string | null
  deliveryAddress: string | null
  desiredDate: string | null
  createdAt: string
  approvedAt: string | null
  user: { id: string; name: string }
  category: { id: string; name: string }
  project: { id: string; projectNumber: string; clientName: string; address: string | null } | null
  items: Array<{
    id: string
    itemName: string
    specification: string | null
    quantity: string | null
    unit: string | null
    memberUnitPrice: string | null
    memberSubtotal: string | null
    status: string | null
    partner: { id: string; name: string }
    product: { id: string; name: string } | null
  }>
  files: Array<{ id: string; fileName: string; fileUrl: string; fileType: string | null }>
}

export default function MemberQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    fetch(`/api/quotes/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setQuote(data))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quotes/${id}/submit`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setQuote(data)
      } else {
        const err = await res.json()
        alert(err.error || 'エラーが発生しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const res = await fetch(`/api/quotes/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        alert(`見積を承認しました。発注番号: ${data.order.orderNumber}`)
        router.push('/member/orders')
      } else {
        const err = await res.json()
        alert(err.error || 'エラーが発生しました')
      }
    } finally {
      setIsApproving(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!quote) {
    return <p className="text-center py-12 text-gray-500">見積が見つかりません</p>
  }

  const displayAmount = quote.memberTotalAmount
    ? `¥${Number(quote.memberTotalAmount).toLocaleString('ja-JP')}`
    : '-'

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member/quotes">
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
        {/* 案件情報 */}
        {quote.project && (
          <Link href={`/member/projects/${quote.project.id}`}>
            <Card className="hover:bg-gray-50">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">案件</p>
                <p className="font-medium">{quote.project.projectNumber} - {quote.project.clientName} 様</p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* 合計金額 */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-400">見積金額（税抜）</p>
            <p className="text-2xl font-bold mt-1">{displayAmount}</p>
          </CardContent>
        </Card>

        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="カテゴリ" value={quote.category.name} />
            <InfoRow label="依頼者" value={quote.user.name} />
            {quote.deliveryAddress && <InfoRow label="納品先" value={quote.deliveryAddress} />}
            {quote.desiredDate && <InfoRow label="希望納期" value={new Date(quote.desiredDate).toLocaleDateString('ja-JP')} />}
            <InfoRow label="作成日" value={new Date(quote.createdAt).toLocaleDateString('ja-JP')} />
            {quote.description && (
              <div>
                <p className="text-sm text-gray-400 mb-1">依頼内容</p>
                <p className="text-sm whitespace-pre-wrap">{quote.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 明細 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">見積明細 ({quote.items.length})</CardTitle></CardHeader>
          <CardContent>
            <QuoteItemsTable items={quote.items} role="member" />
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
                  {f.fileType && <span className="ml-2 text-gray-400">({f.fileType})</span>}
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* アクション */}
        <div className="space-y-3 pb-4">
          {['responded', 'approved'].includes(quote.status) && (
            <Button variant="outline" className="w-full min-h-12" asChild>
              <a href={`/api/quotes/${id}/pdf`} download>
                <Download className="mr-2 h-4 w-4" />見積書PDFダウンロード
              </a>
            </Button>
          )}
          {quote.status === 'draft' && (
            <Button className="w-full min-h-12" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              見積依頼を送信
            </Button>
          )}
          {quote.status === 'responded' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full min-h-12" disabled={isApproving}>
                  {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  見積を承認・発注
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>見積の承認</AlertDialogTitle>
                  <AlertDialogDescription>
                    この見積を承認し、発注を作成しますか？<br />
                    合計金額: {displayAmount}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApprove}>承認して発注</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
