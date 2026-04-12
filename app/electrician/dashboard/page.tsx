'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ShoppingCart, Wrench, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  orderedAt: string | null
  project: { projectNumber: string; clientName: string; address: string | null } | null
  memberName: string
}

interface DashboardData {
  orderCount: number
  activeCount: number
  areaCount: number
  recentOrders: RecentOrder[]
}

export default function ElectricianDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/electrician/dashboard')
      .then((res) => res.ok ? res.json() : null)
      .then((d) => setData(d))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">施工案件・スケジュールを管理</p>
      </div>

      {/* KPI カード */}
      <div className="grid gap-4 grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">対応中</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">全受注</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.orderCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">担当エリア</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.areaCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 直近の施工案件 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500">直近の施工案件</h2>
          <Link href="/electrician/orders">
            <Button variant="ghost" size="sm" className="text-xs">全て見る</Button>
          </Link>
        </div>
        {!data?.recentOrders.length ? (
          <p className="text-center text-gray-400 py-8">担当エリアの施工案件はありません</p>
        ) : (
          <div className="space-y-3">
            {data.recentOrders.map((o) => (
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
                          <p className="font-medium mt-1 truncate">{o.project.clientName} 様</p>
                          {o.project.address && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{o.project.address}</p>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {o.orderedAt ? new Date(o.orderedAt).toLocaleDateString('ja-JP') : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
