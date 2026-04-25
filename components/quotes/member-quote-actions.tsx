'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Send, CheckCircle, Loader2 } from 'lucide-react'

type Props = {
  quoteId: string
  status: string
  displayAmount: string
}

export function MemberQuoteActions({ quoteId, status, displayAmount }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/submit`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
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
      const res = await fetch(`/api/quotes/${quoteId}/approve`, { method: 'POST' })
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

  if (status === 'draft') {
    return (
      <Button className="w-full min-h-12" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        見積依頼を送信
      </Button>
    )
  }

  if (status === 'responded') {
    return (
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
    )
  }

  return null
}
