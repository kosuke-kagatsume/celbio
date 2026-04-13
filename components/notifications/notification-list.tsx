'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Banknote,
  MessageSquare,
  Loader2,
  Check,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  linkUrl: string | null
  isRead: boolean
  createdAt: string
}

const typeIcons: Record<string, React.ReactNode> = {
  quote_requested: <FileText className="h-4 w-4 text-blue-500" />,
  quote_answered: <FileText className="h-4 w-4 text-green-500" />,
  order_created: <ShoppingCart className="h-4 w-4 text-purple-500" />,
  order_status_changed: <ShoppingCart className="h-4 w-4 text-orange-500" />,
  invoice_issued: <Receipt className="h-4 w-4 text-red-500" />,
  payment_received: <CreditCard className="h-4 w-4 text-green-600" />,
  bank_transaction_synced: <Banknote className="h-4 w-4 text-blue-600" />,
  message_received: <MessageSquare className="h-4 w-4 text-indigo-500" />,
}

export function NotificationListPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notifications?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    fetchNotifications()
  }

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    fetchNotifications()
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin}分前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}時間前`
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">通知</h1>
          <p className="text-muted-foreground">すべての通知</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="mr-2 h-4 w-4" />
            すべて既読にする
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              通知はありません
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors min-h-12 ${
                    !n.isRead ? 'bg-blue-50/50 border-blue-200' : ''
                  }`}
                  onClick={() => {
                    if (!n.isRead) handleMarkRead(n.id)
                    if (n.linkUrl) window.location.href = n.linkUrl
                  }}
                >
                  <div className="shrink-0">
                    {typeIcons[n.type] || <Bell className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${!n.isRead ? 'font-medium' : ''}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <Badge variant="default" className="text-[10px] px-1 py-0 shrink-0">
                          未読
                        </Badge>
                      )}
                    </div>
                    {n.message && (
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {formatDate(n.createdAt)}
                  </div>
                </div>
              ))}
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
