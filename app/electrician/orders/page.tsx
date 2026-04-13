'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { Loader2 } from 'lucide-react'

interface OrderItem {
  id: string
  orderNumber: string
  status: string
  totalAmount: string
  createdAt: string
  orderedAt: string | null
  project: { id: string; projectNumber: string; clientName: string; address: string | null } | null
  member: { id: string; name: string }
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

export default function ElectricianOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchOrders() }, [status, page])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))
      const res = await fetch(`/api/electrician/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } finally { setIsLoading(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">施工管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          担当エリアの施工案件 {pagination ? `(${pagination.total}件)` : ''}
        </p>
      </div>

      <div className="mb-4">
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="min-h-12"><SelectValue placeholder="ステータスで絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="ordered">発注済</SelectItem>
            <SelectItem value="confirmed">受注確認済</SelectItem>
            <SelectItem value="shipped">出荷済</SelectItem>
            <SelectItem value="delivered">納品済</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-400 py-8">担当エリアの施工案件はありません</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/electrician/orders/${o.id}`}>
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">{o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    {o.project && (
                      <>
                        <p className="font-medium mt-1 truncate">
                          {o.project.projectNumber} - {o.project.clientName} 様
                        </p>
                        {o.project.address && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{o.project.address}</p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{o.member.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(o.orderedAt ?? o.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>前へ</Button>
          <span className="flex items-center text-sm text-gray-500">{page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>次へ</Button>
        </div>
      )}
    </div>
  )
}
