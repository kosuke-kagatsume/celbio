'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ArrowLeft, Loader2, Package, Truck, CheckCircle2 } from 'lucide-react'

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
}

const ITEM_STATUS: Record<string, { label: string; icon: typeof Package }> = {
  pending: { label: '準備中', icon: Package },
  confirmed: { label: '確定', icon: Package },
  shipped: { label: '出荷済', icon: Truck },
  delivered: { label: '納品済', icon: CheckCircle2 },
}

export default function MemberOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDelivering, setIsDelivering] = useState(false)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) setOrder(await res.json())
    } finally { setIsLoading(false) }
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
        <Link href="/member/orders"><Button variant="link">一覧に戻る</Button></Link>
      </div>
    )
  }

  // 工務店にはマージン込み価格のみ表示
  const displayTotal = order.memberTotalAmount ?? order.totalAmount

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member/orders">
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
        </div>
      </div>

      {/* ステータスタイムライン */}
      <StatusTimeline order={order} />

      {/* 基本情報 */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">発注情報</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-400">合計金額</dt>
            <dd className="font-bold text-lg">{fmtPrice(displayTotal)}</dd>
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
            <dt className="text-gray-400">担当者</dt>
            <dd className="font-medium">{order.user.name}</dd>
          </div>
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

      {/* 発注明細 */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">明細</h2>
        <div className="space-y-3">
          {order.items.map((item) => {
            const st = ITEM_STATUS[item.status || 'pending'] ?? ITEM_STATUS.pending
            const Icon = st.icon
            const price = item.memberUnitPrice ?? item.unitPrice
            const sub = item.memberSubtotal ?? item.subtotal
            return (
              <div key={item.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.itemName}</p>
                    {item.specification && <p className="text-xs text-gray-400 truncate">{item.specification}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {item.quantity}{item.unit || ''} × {fmtPrice(price)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{fmtPrice(sub)}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <Icon className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{st.label}</span>
                    </div>
                  </div>
                </div>
                {(item.shippedAt || item.deliveredAt) && (
                  <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                    {item.shippedAt && <p>出荷: {fmtDate(item.shippedAt)}</p>}
                    {item.deliveredAt && <p>納品: {fmtDate(item.deliveredAt)}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 納品確認アクション */}
      {order.status === 'shipped' && (
        <Button className="w-full min-h-12" onClick={handleDeliver} disabled={isDelivering}>
          {isDelivering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          納品確認
        </Button>
      )}
    </div>
  )
}

/** ステータスタイムライン */
function StatusTimeline({ order }: { order: Order }) {
  const steps = [
    { key: 'draft', label: '下書き', done: true },
    { key: 'ordered', label: '発注済', done: ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(order.status) },
    { key: 'confirmed', label: '受注確認', done: ['confirmed', 'shipped', 'delivered', 'completed'].includes(order.status) },
    { key: 'shipped', label: '出荷済', done: ['shipped', 'delivered', 'completed'].includes(order.status) },
    { key: 'delivered', label: '納品済', done: ['delivered', 'completed'].includes(order.status) },
    { key: 'completed', label: '完了', done: order.status === 'completed' },
  ]

  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          {i > 0 && <div className={`w-4 h-0.5 ${step.done ? 'bg-blue-500' : 'bg-gray-200'}`} />}
          <div className={`flex flex-col items-center min-w-[48px] ${step.done ? 'text-blue-600' : 'text-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              step.done ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {step.done ? '✓' : i + 1}
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
