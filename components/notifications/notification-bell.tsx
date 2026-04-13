'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  linkUrl: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationBellProps {
  rolePrefix: string
}

export function NotificationBell({ rolePrefix }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count)
      }
    } catch {
      // silent
    }
  }, [])

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=5')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch {
      // silent
    }
  }, [])

  // 30秒ポーリング
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // ドロップダウン開いたとき最新取得
  useEffect(() => {
    if (isOpen) fetchRecent()
  }, [isOpen, fetchRecent])

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    fetchUnreadCount()
    fetchRecent()
  }

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setUnreadCount(0)
    fetchRecent()
  }

  const formatTimeAgo = (dateString: string) => {
    const d = new Date(dateString)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 60) return `${diffMin}分前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}時間前`
    const diffDay = Math.floor(diffHour / 24)
    return `${diffDay}日前`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2">
          <DropdownMenuLabel>通知</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllRead}>
              <Check className="mr-1 h-3 w-3" />
              すべて既読
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            通知はありません
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-2 hover:bg-accent/50 cursor-pointer border-b last:border-b-0 ${
                  !n.isRead ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => {
                  if (!n.isRead) handleMarkRead(n.id)
                  if (n.linkUrl) window.location.href = n.linkUrl
                }}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.isRead ? 'font-medium' : ''}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link href={`${rolePrefix}/notifications`}>
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <ExternalLink className="mr-1 h-3 w-3" />
              すべての通知を見る
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
