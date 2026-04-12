'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ArrowLeft, Loader2, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface OrderItem {
  id: string
  itemName: string
  specification: string | null
  quantity: string
  unit: string | null
  unitPrice: string
  subtotal: string
  status: string | null
  shippedAt: string | null
  deliveredAt: string | null
  partner: { id: string; name: string }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  deliveryAddress: string
  desiredDate: string | null
  note: string | null
  orderedAt: string | null
  member: { id: string; name: string; code: string; address: string | null; phone: string | null }
  user: { id: string; name: string; email: string }
  items: OrderItem[]
}

export default function PartnerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShipping, setIsShipping] = useState(false)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) setOrder(await res.json())
    } finally { setIsLoading(false) }
  }

  const handleShip = async () => {
    setIsShipping(true)
    try {
      const res = await fetch(`/api/orders/${id}/ship`, { method: 'POST' })
      if (res.ok) {
        fetchOrder()
      } else {
        const data = await res.json()
        alert(data.error || 'エラーが発生しました')
      }
    } finally { setIsShipping(false) }
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('ja-JP') : '-'
  const fmtPrice = (v: string) => `¥${Number(v).toLocaleString('ja-JP')}`

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">受注が見つかりません</p>
        <Link href="/partner/orders"><Button variant="link">一覧に戻る</Button></Link>
      </div>
    )
  }

  const totalAmount = order.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/partner/orders">
          <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="font-bold mt-1 truncate">{order.member.name} からの受注</p>
        </div>
      </div>

      {/* 発注元情報 */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">発注元情報</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-400">加盟店</dt>
            <dd className="font-medium">{order.member.name}</dd>
          </div>
          <div>
            <dt className="text-gray-400">担当者</dt>
            <dd className="font-medium">{order.user.name}</dd>
          </div>
          <div>
            <dt className="text-gray-400">受注日</dt>
            <dd className="font-medium">{fmtDate(order.orderedAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">希望納期</dt>
            <dd className="font-medium">{fmtDate(order.desiredDate)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">合計金額</dt>
            <dd className="font-bold text-lg">{fmtPrice(totalAmount.toString())}</dd>
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

      {/* 受注明細 */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">受注明細</h2>
        <div className="space-y-3">
          {order.items.map((item) => {
            const isPending = !item.status || item.status === 'pending'
            const isShipped = item.status === 'shipped'
            const isDelivered = item.status === 'delivered'
            return (
              <div key={item.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.itemName}</p>
                    {item.specification && <p className="text-xs text-gray-400 truncate">{item.specification}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {item.quantity}{item.unit || ''} × {fmtPrice(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{fmtPrice(item.subtotal)}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {isDelivered && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      {isShipped && <Truck className="h-3 w-3 text-yellow-500" />}
                      {isPending && <ShieldCheck className="h-3 w-3 text-gray-400" />}
                      <span className="text-xs text-gray-400">
                        {isDelivered ? '納品済' : isShipped ? '出荷済' : '出荷待ち'}
                      </span>
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

      {/* 出荷報告アクション */}
      {order.status === 'confirmed' && (
        <Button className="w-full min-h-12" onClick={handleShip} disabled={isShipping}>
          {isShipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
          出荷報告
        </Button>
      )}
    </div>
  )
}
