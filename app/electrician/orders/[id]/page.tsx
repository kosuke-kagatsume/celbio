'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ArrowLeft, Loader2, MapPin, Package, Truck, CheckCircle2 } from 'lucide-react'

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
  totalAmount: string
  deliveryAddress: string
  desiredDate: string | null
  note: string | null
  orderedAt: string | null
  createdAt: string
  project: { id: string; projectNumber: string; clientName: string; address: string | null } | null
  member: { id: string; name: string; code: string; address: string | null; phone: string | null }
  user: { id: string; name: string; email: string }
  items: OrderItem[]
}

const ITEM_STATUS: Record<string, { label: string; icon: typeof Package }> = {
  pending: { label: '準備中', icon: Package },
  shipped: { label: '出荷済', icon: Truck },
  delivered: { label: '納品済', icon: CheckCircle2 },
}

export default function ElectricianOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) setOrder(await res.json())
    } finally { setIsLoading(false) }
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('ja-JP') : '-'

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">案件が見つかりません</p>
        <Link href="/electrician/orders"><Button variant="link">一覧に戻る</Button></Link>
      </div>
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/electrician/orders">
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

      {/* 現場情報 */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">現場情報</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          {order.project?.address && (
            <div>
              <dt className="text-gray-400">現場住所</dt>
              <dd className="font-medium flex items-start gap-1 mt-0.5">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                {order.project.address}
              </dd>
            </div>
          )}
          {order.deliveryAddress && order.deliveryAddress !== order.project?.address && (
            <div>
              <dt className="text-gray-400">納品先</dt>
              <dd className="font-medium">{order.deliveryAddress}</dd>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-gray-400">発注日</dt>
              <dd className="font-medium">{fmtDate(order.orderedAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-400">希望納期</dt>
              <dd className="font-medium">{fmtDate(order.desiredDate)}</dd>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-gray-400">加盟店</dt>
              <dd className="font-medium">{order.member.name}</dd>
            </div>
            <div>
              <dt className="text-gray-400">担当者</dt>
              <dd className="font-medium">{order.user.name}</dd>
            </div>
          </div>
          {order.note && (
            <div>
              <dt className="text-gray-400">備考</dt>
              <dd className="whitespace-pre-wrap">{order.note}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 資材一覧（電気工事屋は施工に必要な資材を確認する） */}
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-500 mb-3">資材一覧</h2>
        <div className="space-y-3">
          {order.items.map((item) => {
            const st = ITEM_STATUS[item.status || 'pending'] ?? ITEM_STATUS.pending
            const Icon = st.icon
            return (
              <div key={item.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.itemName}</p>
                    {item.specification && <p className="text-xs text-gray-400 truncate">{item.specification}</p>}
                    <p className="text-xs text-gray-500 mt-1">{item.quantity}{item.unit || ''}</p>
                    <p className="text-xs text-gray-400">{item.partner.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{st.label}</span>
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
    </div>
  )
}
