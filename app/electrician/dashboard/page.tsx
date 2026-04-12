'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Wrench, MapPin, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ElectricianDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 mt-1">施工案件・スケジュールを管理</p>
      </div>

      {/* KPI カード */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">施工予定</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0件</div>
            <p className="text-xs text-muted-foreground">今月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">受注</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0件</div>
            <p className="text-xs text-muted-foreground">対応待ち</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">担当エリア</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">登録済み</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">メッセージ</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0件</div>
            <p className="text-xs text-muted-foreground">未読</p>
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>よく使う機能へのショートカット</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <Link href="/electrician/orders">
              <Button variant="outline" className="w-full justify-start min-h-12">
                <ShoppingCart className="mr-2 h-4 w-4" />
                受注一覧
              </Button>
            </Link>
            <Link href="/electrician/messages">
              <Button variant="outline" className="w-full justify-start min-h-12">
                <MessageSquare className="mr-2 h-4 w-4" />
                メッセージ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
