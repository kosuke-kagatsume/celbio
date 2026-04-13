'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { MessageThread } from '@/components/messages/message-thread'

interface MessageDetailPageProps {
  threadId: string
  backUrl: string
}

interface ThreadData {
  id: string
  subject: string | null
  threadType: string
  status: string
  createdAt: string
  order: { id: string; orderNumber: string } | null
  quote: { id: string; quoteNumber: string } | null
  member: { id: string; name: string } | null
  partner: { id: string; name: string } | null
  messages: Array<{
    id: string
    content: string
    createdAt: string
    sender: { id: string; name: string; role: string }
    files: Array<{ id: string; fileName: string; fileUrl: string }>
  }>
}

export function MessageDetailPage({ threadId, backUrl }: MessageDetailPageProps) {
  const [thread, setThread] = useState<ThreadData | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${threadId}`)
      if (res.ok) {
        setThread(await res.json())
      } else {
        const data = await res.json()
        setError(data.error || 'スレッドの取得に失敗しました')
      }
    } catch {
      setError('スレッドの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    fetchThread()
    // ユーザーID取得
    fetch('/api/me').then((r) => r.json()).then((u) => setCurrentUserId(u.id)).catch(() => {})
  }, [fetchThread])

  if (isLoading || !currentUserId) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {error || 'スレッドが見つかりません'}
      </div>
    )
  }

  return (
    <MessageThread
      thread={thread}
      currentUserId={currentUserId}
      backUrl={backUrl}
      onRefresh={fetchThread}
    />
  )
}
