'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ArrowLeft, Loader2, ShieldCheck, CreditCard, CheckCircle2, Download } from 'lucide-react'

interface OrderItem {
  id: string
  itemName: string
  specification: string | null
  quantity: string
  unit: string | null
  unitPrice: string
  subtotal: string
  memberUnitPrice: string | null
  memberSubtotal: string | null
  status: string | null
  shippedAt: string | null
  deliveredAt: string | null
  partner: { id: string; name: string; code: string }
  product: { id: string; name: string; code: string } | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: string
  memberTotalAmount: string | null
  deliveryAddress: string
  desiredDate: string | null
  note: string | null
  orderedAt: string | null
  confirmedAt: string | null
  createdAt: string
  project: { id: string; projectNumber: string; clientName: string; paymentConfirmedAt: string | null } | null
  member: { id: string; name: string; code: string; address: string | null; phone: string | null }
  user: { id: string; name: string; email: string }
  quote: { id: string; quoteNumber: string; title: string; category: { id: string; name: string } } | null
  items: OrderItem[]
  invoices: Array<{ id: string; invoiceNumber: string; totalAmount: string; status: string }>
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDelivering, setIsDelivering] = useState(false)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) setOrder(await res.json())
    } finally { setIsLoading(false) }
  }

  const handleConfirmOrder = async () => {
    setIsConfirming(true)
    try {
      const res = await fetch(`/api/orders/${id}/confirm`, { method: 'POST' })
      if (res.ok) {
        fetchOrder()
      } else {
        const data = await res.json()
        alert(data.error || 'エラーが発生しました')
      }
    } finally { setIsConfirming(false) }
  }

  const handleDeliver = async () => {
    setIsDelivering(true)
    try {
      const res = await fetch(`/api/orders/${id}/deliver`, { method: 'POST' })
      if (res.ok) {
        fetchOrder()
      } else {
        const data = await res.json()
        alert(data.error || 'エラーが発生しました')
      }
    } finally { setIsDelivering(false) }
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('ja-JP') : '-'
  const fmtPrice = (v: string) => `¥${Number(v).toLocaleString('ja-JP')}`

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">発注が見つかりません</p>
        <Link href="/admin/orders"><Button variant="link">一覧に戻る</Button></Link>
      </div>
    )
  }

  const paymentConfirmed = order.project?.paymentConfirmedAt != null

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          {order.project && (
            <p className="font-bold mt-1 truncate">{order.project.projectNumber} - {order.project.clientName} 様</p>
          )}
          <p className="text-xs text-gray-400">{order.member.name} / {order.user.name}</p>
        </div>
      </div>

      {/* 入金状況バナー */}
      {order.status === 'draft' && (
        <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 ${
          paymentConfirmed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          <CreditCard className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            {paymentConfirmed
              ? `入金確認済（${fmtDate(order.project?.paymentConfirmedAt ?? null)}）`
              : '入金未確認 — 発注確定できません'}
          </span>
        </div>
      )}

      {/* 基本情報（原価 + マージン込み両方表示） */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">発注情報</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-400">原価合計</dt>
            <dd className="font-bold text-lg">{fmtPrice(order.totalAmount)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">マージン込合計</dt>
            <dd className="font-bold text-lg text-blue-600">
              {order.memberTotalAmount ? fmtPrice(order.memberTotalAmount) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">発注日</dt>
            <dd className="font-medium">{fmtDate(order.orderedAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">希望納期</dt>
            <dd className="font-medium">{fmtDate(order.desiredDate)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">加盟店</dt>
            <dd className="font-medium">{order.member.name}</dd>
          </div>
          <div>
            <dt className="text-gray-400">担当者</dt>
            <dd className="font-medium">{order.user.name}</dd>
          </div>
          {order.quote && (
            <div className="col-span-2">
              <dt className="text-gray-400">見積</dt>
              <dd>
                <Link href={`/admin/quotes/${order.quote.id}`} className="text-blue-600 text-sm">
                  {order.quote.quoteNumber} — {order.quote.title}
                </Link>
              </dd>
            </div>
          )}
          {order.deliveryAddress && (
            <div className="col-span-2">
              <dt className="text-gray-400">納品先</dt>
              <dd className="font-medium">{order.deliveryAddress}</dd>
            </div>
          )}
          {order.note && (
            <div className="col-span-2">
              <dt className="text-gray-400">備考</dt>
              <dd className="whitespace-pre-wrap">{order.note}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 明細（原価 + マージン込み） */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">明細</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.itemName}</p>
                  {item.specification && <p className="text-xs text-gray-400 truncate">{item.specification}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{item.partner.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.quantity}{item.unit || ''} × {fmtPrice(item.unitPrice)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">{fmtPrice(item.subtotal)}</p>
                  {item.memberSubtotal && (
                    <p className="text-xs text-blue-600">M: {fmtPrice(item.memberSubtotal)}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {item.status === 'shipped' ? '出荷済' : item.status === 'delivered' ? '納品済' : '準備中'}
                  </p>
                </div>
              </div>
              {(item.shippedAt || item.deliveredAt) && (
                <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                  {item.shippedAt && <p>出荷: {fmtDate(item.shippedAt)}</p>}
                  {item.deliveredAt && <p>納品: {fmtDate(item.deliveredAt)}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="space-y-3">
        {order.status !== 'draft' && (
          <Button variant="outline" className="w-full min-h-12" asChild>
            <a href={`/api/orders/${id}/pdf`} download>
              <Download className="mr-2 h-4 w-4" />発注書PDFダウンロード
            </a>
          </Button>
        )}
        {order.status === 'draft' && paymentConfirmed && (
          <Button className="w-full min-h-12" onClick={handleConfirmOrder} disabled={isConfirming}>
            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            発注確定（メーカーへ発注）
          </Button>
        )}
        {order.status === 'shipped' && (
          <Button className="w-full min-h-12" variant="outline" onClick={handleDeliver} disabled={isDelivering}>
            {isDelivering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            納品確認
          </Button>
        )}
      </div>
    </div>
  )
}
