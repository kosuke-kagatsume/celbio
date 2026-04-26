import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPartnerDashboardStats } from '@/lib/dashboard/partner-stats'
import { getCurrentMonthRange } from '@/lib/dashboard/period'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Package,
  AlertCircle,
  TrendingUp,
  Truck,
} from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

export default async function PartnerDashboardPage() {
  const user = await requireRole(['partner'])
  if (!user.partnerId) redirect('/login')

  const data = await getPartnerDashboardStats(user.partnerId)
  const { year, month } = getCurrentMonthRange()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">見積回答・受注・出荷を管理</p>
        </div>
        <Link href="/partner/products">
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            商材管理
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/partner/quotes?status=pending">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${data.pendingQuotes > 0 ? 'border-blue-200 bg-blue-50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${data.pendingQuotes > 0 ? 'text-blue-900' : ''}`}>見積依頼</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.pendingQuotes > 0 ? 'text-blue-900' : ''}`}>{data.pendingQuotes}件</div>
              {data.pendingQuotes > 0 ? (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  回答待ち
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">回答待ちなし</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/partner/orders">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${data.pendingOrders > 0 ? 'border-yellow-200 bg-yellow-50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${data.pendingOrders > 0 ? 'text-yellow-900' : ''}`}>受注</CardTitle>
              <ShoppingCart className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.pendingOrders > 0 ? 'text-yellow-900' : ''}`}>{data.pendingOrders}件</div>
              {data.pendingOrders > 0 ? (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  出荷待ち
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">出荷待ちなし</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/partner/orders?status=shipped">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">出荷済み</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.shippedOrders}件</div>
              <p className="text-xs text-muted-foreground">納品待ち</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/partner/invoices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">請求書</CardTitle>
              <Receipt className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.unpaidInvoices}件</div>
              <p className="text-xs text-muted-foreground">未入金</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              今月の請求
            </CardTitle>
            <CardDescription>{year}年{month}月</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(data.monthlyInvoiceAmount)}</div>
            <p className="text-muted-foreground">{data.monthlyInvoiceCount}件の請求</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              今月の入金
            </CardTitle>
            <CardDescription>{year}年{month}月</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(data.monthlyPaymentAmount)}</div>
            <p className="text-muted-foreground">{data.monthlyPaymentCount}件の入金</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>よく使う機能へのショートカット</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/partner/quotes">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                見積依頼一覧
              </Button>
            </Link>
            <Link href="/partner/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                受注一覧
              </Button>
            </Link>
            <Link href="/partner/payments">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                入金確認
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
