'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CreditCard, Loader2 } from 'lucide-react'

interface Payment {
  id: string
  amount: string
  status: string
  createdAt: string
  invoice: {
    id: string
    invoiceNumber: string
    totalAmount: string
    member: { id: string; name: string }
    order: { id: string; orderNumber: string }
  } | null
}

interface PaymentData {
  payments: Payment[]
  summary: { totalAmount: number; count: number }
}

export default function ElectricianPaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (selectedYear !== 'all') params.set('year', selectedYear)
    if (selectedMonth !== 'all') params.set('month', selectedMonth)
    fetch(`/api/payments?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .finally(() => setIsLoading(false))
  }, [selectedYear, selectedMonth])

  const formatDate = (s: string) => new Date(s).toLocaleDateString('ja-JP')
  const formatCurrency = (a: string | number) => {
    const n = typeof a === 'string' ? parseFloat(a) : a
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">入金確認</h1>
          <p className="text-muted-foreground">受け取り済みの入金履歴</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="年" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全期間</SelectItem>
              {years.map((y) => <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="月" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全月</SelectItem>
              {months.map((m) => <SelectItem key={m} value={m.toString()}>{m}月</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {data && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">期間合計</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalAmount)}</div>
                <div className="text-sm text-muted-foreground">{data.summary.count}件</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />入金一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !data || data.payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">入金履歴がありません</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>入金日</TableHead>
                  <TableHead>請求書番号</TableHead>
                  <TableHead>加盟店</TableHead>
                  <TableHead>発注番号</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="font-medium">{p.invoice?.invoiceNumber || '-'}</TableCell>
                    <TableCell>{p.invoice?.member.name || '-'}</TableCell>
                    <TableCell>{p.invoice?.order.orderNumber || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell><Badge variant="default">入金済み</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
