'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Check, Banknote, FileCheck } from 'lucide-react'
import { PAYMENT_STATUSES, type PaymentStatus, getNextStatus } from '@/lib/partner-payments'
import Link from 'next/link'

interface PaymentDetail {
  id: string
  periodYear: number
  periodMonth: number
  totalAmount: string
  status: string
  transferDate: string | null
  transferRef: string | null
  partner: { id: string; name: string; code: string }
  items: {
    id: string
    amount: string
    invoice: {
      id: string; invoiceNumber: string; amount: string; taxAmount: string | null
      totalAmount: string; issuedAt: string | null; dueDate: string | null; status: string
      order: { id: string; orderNumber: string } | null
    }
  }[]
}

export default function PartnerPaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [transferDate, setTransferDate] = useState('')
  const [transferRef, setTransferRef] = useState('')

  useEffect(() => { fetchPayment() }, [id])

  const fetchPayment = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/partner-payments/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPayment(data.payment)
        if (data.payment.transferDate) {
          setTransferDate(data.payment.transferDate.split('T')[0])
        }
        if (data.payment.transferRef) {
          setTransferRef(data.payment.transferRef)
        }
      }
    } finally { setIsLoading(false) }
  }

  const handleTransition = async () => {
    if (!payment) return
    const nextStatus = getNextStatus(payment.status)
    if (!nextStatus) return

    setIsUpdating(true)
    try {
      const body: Record<string, unknown> = { status: nextStatus }
      if (nextStatus === 'transferred') {
        if (!transferDate) { alert('振込日を入力してください'); setIsUpdating(false); return }
        body.transferDate = transferDate
        body.transferRef = transferRef || undefined
      }

      const res = await fetch(`/api/admin/partner-payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) fetchPayment()
    } finally { setIsUpdating(false) }
  }

  const statusBadge = (status: string) => {
    const info = PAYMENT_STATUSES[status as PaymentStatus]
    if (!info) return <Badge variant="outline">{status}</Badge>
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
    }
    return <Badge className={`${colorMap[info.color]} text-xs`}>{info.label}</Badge>
  }

  const nextActionLabel: Record<string, { label: string; icon: typeof Check }> = {
    pending: { label: '承認する', icon: Check },
    approved: { label: '振込実行', icon: Banknote },
    transferred: { label: '完了にする', icon: FileCheck },
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!payment) {
    return <p className="text-center text-gray-400 py-12">支払データが見つかりません</p>
  }

  const nextStatus = getNextStatus(payment.status)
  const action = nextStatus ? nextActionLabel[payment.status] : null

  return (
    <div>
      <Link href="/admin/partner-payments" className="inline-flex items-center text-sm text-blue-600 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        支払一覧に戻る
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{payment.partner.name}</h1>
          {statusBadge(payment.status)}
        </div>
        <p className="text-sm text-gray-500">
          {payment.periodYear}年{payment.periodMonth}月分 / {payment.partner.code}
        </p>
      </div>

      {/* 合計 */}
      <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="font-medium">支払合計</span>
          <span className="text-2xl font-bold">¥{Number(payment.totalAmount).toLocaleString()}</span>
        </div>
        {payment.transferDate && (
          <p className="text-sm text-gray-500 mt-1">
            振込日: {new Date(payment.transferDate).toLocaleDateString('ja-JP')}
            {payment.transferRef && ` / 参照: ${payment.transferRef}`}
          </p>
        )}
      </div>

      {/* 振込情報入力（approved → transferred 時） */}
      {payment.status === 'approved' && (
        <div className="border rounded-lg p-4 mb-6 bg-blue-50 space-y-3">
          <h2 className="font-bold text-sm">振込情報</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">
              振込日 <span className="text-red-500">*</span>
            </label>
            <Input
              type="date" value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="min-h-12"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">振込参照番号</label>
            <Input
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              placeholder="任意"
              className="min-h-12"
            />
          </div>
        </div>
      )}

      {/* アクションボタン */}
      {action && (
        <Button
          className="w-full min-h-14 text-lg mb-6"
          onClick={handleTransition}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <action.icon className="mr-2 h-5 w-5" />
          )}
          {action.label}
        </Button>
      )}

      {/* 請求書明細 */}
      <h2 className="font-bold mb-3">請求書明細（{payment.items.length}件）</h2>
      <div className="space-y-2">
        {payment.items.map((item) => (
          <div key={item.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm font-mono">{item.invoice.invoiceNumber}</p>
                {item.invoice.order && (
                  <p className="text-xs text-gray-500">発注: {item.invoice.order.orderNumber}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {item.invoice.issuedAt && (
                    <span className="text-xs text-gray-400">
                      発行: {new Date(item.invoice.issuedAt).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                  {item.invoice.dueDate && (
                    <span className="text-xs text-gray-400">
                      期限: {new Date(item.invoice.dueDate).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>
              </div>
              <p className="font-bold">¥{Number(item.amount).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
