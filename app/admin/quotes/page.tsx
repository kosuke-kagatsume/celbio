'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuoteList } from '@/components/quotes/quote-list'
import { QUOTE_STATUSES } from '@/lib/quote-constants'
import { Loader2 } from 'lucide-react'

interface QuoteItem {
  id: string
  quoteNumber: string
  title: string | null
  status: string
  totalAmount: string | null
  memberTotalAmount: string | null
  createdAt: string
  category: { id: string; name: string }
  member: { id: string; name: string }
  project: { id: string; projectNumber: string; clientName: string } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminQuotesPage() {
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
        <h1 className="text-2xl font-bold">見積管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          全加盟店の見積一覧 {pagination ? `(${pagination.total}件)` : ''}
        </p>
      </div>

      <div className="mb-4">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="min-h-12">
            <SelectValue placeholder="ステータスで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            {Object.entries(QUOTE_STATUSES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <QuoteList quotes={quotes} basePath="/admin/quotes" role="admin" showMember />
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>前へ</Button>
          <span className="flex items-center text-sm text-gray-500">{page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>次へ</Button>
        </div>
      )}
    </div>
  )
}
