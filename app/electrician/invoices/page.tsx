'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Receipt, Eye, Plus, Loader2 } from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  amount: string
  taxAmount: string
  totalAmount: string
  issuedAt: string | null
  dueDate: string | null
  order: { id: string; orderNumber: string }
  member: { id: string; name: string }
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  issued: { label: '発行済み', variant: 'default' },
  sent: { label: '送付済み', variant: 'outline' },
  paid: { label: '入金済み', variant: 'default' },
  cancelled: { label: 'キャンセル', variant: 'destructive' },
}

export default function ElectricianInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/invoices?${params}`)
      .then((r) => r.ok ? r.json() : { invoices: [] })
      .then((d) => setInvoices(d.invoices))
      .finally(() => setIsLoading(false))
  }, [statusFilter])

  const formatDate = (s: string | null) => s ? new Date(s).toLocaleDateString('ja-JP') : '-'
  const formatCurrency = (a: string) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(parseFloat(a))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">請求書一覧</h1>
          <p className="text-muted-foreground">発行した請求書の管理</p>
        </div>
        <Link href="/electrician/invoices/new">
          <Button><Plus className="mr-2 h-4 w-4" />請求書発行</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />請求書一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="ステータス" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="issued">発行済み</SelectItem>
                <SelectItem value="sent">送付済み</SelectItem>
                <SelectItem value="paid">入金済み</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">請求書がありません</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>請求書番号</TableHead>
                  <TableHead>発注番号</TableHead>
                  <TableHead>加盟店</TableHead>
                  <TableHead className="text-right">税抜金額</TableHead>
                  <TableHead className="text-right">税込金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>発行日</TableHead>
                  <TableHead>支払期限</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <Link href={`/electrician/orders/${inv.order.id}`} className="text-blue-600 hover:underline">
                        {inv.order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.member.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[inv.status]?.variant || 'secondary'}>
                        {statusLabels[inv.status]?.label || inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(inv.issuedAt)}</TableCell>
                    <TableCell>{formatDate(inv.dueDate)}</TableCell>
                    <TableCell>
                      <Link href={`/electrician/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
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
