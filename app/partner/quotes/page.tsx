'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface QuoteItem {
  id: string
  quoteNumber: string
  title: string | null
  status: string
  totalAmount: string | null
  createdAt: string
  desiredDate: string | null
  category: { id: string; name: string }
  member: { id: string; name: string }
  items: Array<{ id: string; status: string | null }>
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PartnerQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchQuotes()
  }, [status, page])

  const fetchQuotes = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))

      const res = await fetch(`/api/quotes?${params}`)
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes)
        setPagination(data.pagination)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">見積回答</h1>
        <p className="text-sm text-gray-500 mt-1">
          受信した見積依頼 {pagination ? `(${pagination.total}件)` : ''}
        </p>
      </div>

      <div className="mb-4">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="min-h-12">
            <SelectValue placeholder="ステータスで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="requested">回答待ち</SelectItem>
            <SelectItem value="responded">回答済</SelectItem>
            <SelectItem value="approved">承認済</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : quotes.length === 0 ? (
        <p className="text-center text-gray-400 py-8">見積依頼はありません</p>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const pendingCount = q.items.filter((i) => i.status !== 'quoted').length
            return (
              <Link key={q.id} href={`/partner/quotes/${q.id}`}>
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-mono">{q.quoteNumber}</span>
                        <QuoteStatusBadge status={q.status} />
                        {pendingCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {pendingCount}件未回答
                          </span>
                        )}
                      </div>
                      <p className="font-medium mt-1 truncate">{q.title ?? q.category.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{q.member.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {q.totalAmount != null && (
                        <p className="font-semibold text-sm">¥{Number(q.totalAmount).toLocaleString('ja-JP')}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(q.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>���へ</Button>
          <span className="flex items-center text-sm text-gray-500">{page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>次へ</Button>
        </div>
      )}
    </div>
  )
}
