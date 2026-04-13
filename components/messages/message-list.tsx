'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageSquare, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'

interface ThreadSummary {
  id: string
  subject: string | null
  threadType: string
  status: string
  updatedAt: string
  order: { id: string; orderNumber: string } | null
  quote: { id: string; quoteNumber: string } | null
  member: { id: string; name: string } | null
  partner: { id: string; name: string } | null
  messages: Array<{
    content: string
    createdAt: string
    sender: { id: string; name: string }
  }>
  _count: { messages: number }
}

interface MessageListProps {
  rolePrefix: string
  showNewButton?: boolean
}

export function MessageList({ rolePrefix, showNewButton = true }: MessageListProps) {
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/messages?${params}`)
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching threads:', error)
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin}分前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}時間前`
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  const getThreadTitle = (thread: ThreadSummary) => {
    if (thread.subject) return thread.subject
    if (thread.order) return `発注 ${thread.order.orderNumber}`
    if (thread.quote) return `見積 ${thread.quote.quoteNumber}`
    return '問い合わせ'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">メッセージ</h1>
          <p className="text-muted-foreground">お問い合わせ・連絡</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="open">オープン</SelectItem>
              <SelectItem value="closed">クローズ</SelectItem>
            </SelectContent>
          </Select>
          {showNewButton && (
            <Link href={`${rolePrefix}/messages/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新規作成
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            スレッド一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              メッセージはありません
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => {
                const lastMsg = thread.messages[0]
                return (
                  <Link key={thread.id} href={`${rolePrefix}/messages/${thread.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{getThreadTitle(thread)}</span>
                          <Badge variant={thread.status === 'open' ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {thread.status === 'open' ? 'オープン' : 'クローズ'}
                          </Badge>
                        </div>
                        {lastMsg && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMsg.sender.name}: {lastMsg.content}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {thread.member && <span>{thread.member.name}</span>}
                          {thread.partner && <span>{thread.partner.name}</span>}
                          <span>{thread._count.messages}件</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4 shrink-0">
                        {formatDate(thread.updatedAt)}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                前へ
              </Button>
              <span className="flex items-center px-4">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                次へ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
