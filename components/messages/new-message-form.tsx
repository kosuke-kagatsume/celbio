'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface NewMessageFormProps {
  rolePrefix: string
}

const THREAD_TYPES = [
  { value: 'inquiry', label: 'お問い合わせ' },
  { value: 'order', label: '発注に関して' },
  { value: 'quote', label: '見積に関して' },
  { value: 'project', label: '案件に関して' },
] as const

export function NewMessageForm({ rolePrefix }: NewMessageFormProps) {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [threadType, setThreadType] = useState('inquiry')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('メッセージを入力してください')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim() || null,
          threadType,
          message: message.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '送信に失敗しました')
        return
      }

      const thread = await res.json()
      router.push(`${rolePrefix}/messages/${thread.id}`)
    } catch {
      setError('送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`${rolePrefix}/messages`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">新規メッセージ</h1>
          <p className="text-muted-foreground">お問い合わせ・連絡を作成</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>メッセージ作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="threadType">種別</Label>
              <Select value={threadType} onValueChange={setThreadType}>
                <SelectTrigger className="min-h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THREAD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">件名（任意）</Label>
              <Input
                id="subject"
                className="min-h-12"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="件名を入力"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">メッセージ</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="メッセージを入力してください"
                rows={6}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="min-h-12">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                送信
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
