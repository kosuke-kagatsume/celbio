import { requireRole } from '@/lib/auth'
import { getAdminDashboardStats } from '@/lib/dashboard/admin-stats'
import { getCurrentMonthRange } from '@/lib/dashboard/period'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Receipt,
  CreditCard,
  Building2,
  Factory,
  AlertCircle,
  Clock,
  TrendingUp,
  FileText,
  ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

export default async function AdminDashboardPage() {
  await requireRole(['admin'])
  const data = await getAdminDashboardStats()
  const { year, month } = getCurrentMonthRange()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">セリビオ管理画面</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/quotes">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち見積</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.pendingQuotes}件</div>
              {data.pendingQuotes > 0 && (
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  対応が必要です
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">進行中発注</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeOrders}件</div>
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                処理中
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/invoices">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未払い請求書</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.unpaidInvoices}件</div>
              {data.unpaidInvoices > 0 && (
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  入金待ち
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/payments">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち入金</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.pendingPayments}件</div>
              {data.pendingPayments > 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  差異確認が必要
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              今月の発注
            </CardTitle>
            <CardDescription>{year}年{month}月</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(data.monthlyOrderAmount)}</div>
            <p className="text-muted-foreground">{data.monthlyOrderCount}件の発注</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/members">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録加盟店</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.members}社</div>
              <p className="text-xs text-muted-foreground">アクティブ</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/partners">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録メーカー</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.partners}社</div>
              <p className="text-xs text-muted-foreground">アクティブ</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
