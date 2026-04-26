import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMemberDashboardStats } from '@/lib/dashboard/member-stats'
import { getCurrentMonthRange } from '@/lib/dashboard/period'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Plus,
  Package,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

export default async function MemberDashboardPage() {
  const user = await requireRole(['member'])
  if (!user.memberId) redirect('/login')

  const data = await getMemberDashboardStats(user.memberId)
  const { year, month } = getCurrentMonthRange()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">建築資材の見積・発注を管理</p>
        </div>
        <div className="flex gap-2">
          <Link href="/member/quotes/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              見積依頼
            </Button>
          </Link>
          <Link href="/member/catalog">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              商材カタログ
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/member/quotes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">見積依頼</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.draftQuotes + data.pendingQuotes}件</div>
              <p className="text-xs text-muted-foreground">
                下書き {data.draftQuotes} / 回答待ち {data.pendingQuotes}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/member/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">進行中発注</CardTitle>
              <ShoppingCart className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeOrders}件</div>
              <p className="text-xs text-muted-foreground">処理中</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/member/invoices">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${data.unpaidInvoices > 0 ? 'border-orange-200 bg-orange-50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${data.unpaidInvoices > 0 ? 'text-orange-900' : ''}`}>請求書</CardTitle>
              <Receipt className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.unpaidInvoices > 0 ? 'text-orange-900' : ''}`}>{data.unpaidInvoices}件</div>
              {data.unpaidInvoices > 0 ? (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  未払い
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">未払いなし</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/member/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">入金履歴</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.monthlyPaymentCount}件</div>
              <p className="text-xs text-muted-foreground">今月</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
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
              今月の支払い
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
            <Link href="/member/quotes/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                新規見積依頼
              </Button>
            </Link>
            <Link href="/member/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                発注一覧
              </Button>
            </Link>
            <Link href="/member/invoices">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" />
                請求書一覧
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
