'use client'

import Link from 'next/link'
import { OrderStatusBadge } from './order-status-badge'

interface OrderListItem {
  id: string
  orderNumber: string
  status: string
  totalAmount: string
  createdAt: string
  orderedAt: string | null
  project?: { id: string; projectNumber: string; clientName: string } | null
  member?: { id: string; name: string }
  quote?: { id: string; quoteNumber: string; title: string | null } | null
}

interface OrderListProps {
  orders: OrderListItem[]
  basePath: string
  showMember?: boolean
}

export function OrderList({ orders, basePath, showMember }: OrderListProps) {
  if (orders.length === 0) {
    return <p className="text-center text-gray-400 py-8">発注はありません</p>
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Link key={o.id} href={`${basePath}/${o.id}`}>
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">{o.orderNumber}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                {o.project && (
                  <p className="font-medium mt-1 truncate">
                    {o.project.projectNumber} - {o.project.clientName} 様
                  </p>
                )}
                {o.quote?.title && (
                  <p className="text-xs text-gray-400 mt-0.5">{o.quote.title}</p>
                )}
                {showMember && o.member && (
                  <p className="text-xs text-gray-400 mt-0.5">{o.member.name}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">
                  ¥{Number(o.totalAmount).toLocaleString('ja-JP')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(o.orderedAt ?? o.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
