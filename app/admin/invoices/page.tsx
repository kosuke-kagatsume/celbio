'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, AlertCircle, Banknote, Eye, Loader2 } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  status: string;
  issuedAt: string | null;
  dueDate: string | null;
  order: { id: string; orderNumber: string };
  partner: { id: string; name: string; code: string };
  member: { id: string; name: string; code: string };
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  issued: { label: '発行済み', variant: 'outline' },
  sent: { label: '送付済み', variant: 'default' },
  paid: { label: '支払済み', variant: 'default' },
  cancelled: { label: 'キャンセル', variant: 'destructive' },
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, unpaid: 0, unpaidAmount: 0 });

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, page]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        if (statusFilter === 'unpaid') {
          // 未払いはissued/sentをOR条件で取得する必要があるため、後でフィルタリング
        } else {
          params.append('status', statusFilter);
        }
      }
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let filteredInvoices = data.invoices;

        // 未払いフィルターの場合はクライアント側でフィルタリング
        if (statusFilter === 'unpaid') {
          filteredInvoices = data.invoices.filter(
            (inv: Invoice) => inv.status === 'issued' || inv.status === 'sent'
          );
        }

        setInvoices(filteredInvoices);
        setTotalPages(data.pagination.totalPages);

        // 統計情報を計算
        if (statusFilter === 'all' && page === 1) {
          const allRes = await fetch('/api/invoices?limit=1000');
          const allData = await allRes.json();
          const allInvoices = allData.invoices as Invoice[];

          let unpaidCount = 0;
          let unpaidAmount = 0;

          allInvoices.forEach((inv) => {
            if (inv.status === 'issued' || inv.status === 'sent') {
              unpaidCount++;
              const amount = typeof inv.totalAmount === 'string'
                ? parseFloat(inv.totalAmount)
                : inv.totalAmount;
              unpaidAmount += amount;
            }
          });

          setStats({
            total: allData.pagination.total,
            unpaid: unpaidCount,
            unpaidAmount,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: number | string | null) => {
    if (amount === null || amount === undefined) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(numAmount);
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate) return false;
    if (status === 'paid' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">請求書管理</h1>
        <p className="text-muted-foreground">全請求書を一覧・入金状況を管理</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総請求書数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未払い</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unpaid}件</div>
            <p className="text-xs text-muted-foreground">発行済み・送付済み</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未払い総額</CardTitle>
            <Banknote className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.unpaidAmount)}</div>
            <p className="text-xs text-muted-foreground">未払い請求書の合計</p>
          </CardContent>
        </Card>
      </div>

      {/* 請求書一覧 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              請求書一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="unpaid">未払い</SelectItem>
                <SelectItem value="paid">支払済み</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              請求書がありません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>請求書番号</TableHead>
                    <TableHead>発注番号</TableHead>
                    <TableHead>加盟店</TableHead>
                    <TableHead>メーカー</TableHead>
                    <TableHead className="text-right">税抜金額</TableHead>
                    <TableHead className="text-right">税込金額</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>発行日</TableHead>
                    <TableHead>支払期限</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const overdue = isOverdue(invoice.dueDate, invoice.status);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/orders/${invoice.order.id}`} className="text-blue-600 hover:underline">
                            {invoice.order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.member.name}</div>
                            <div className="text-sm text-muted-foreground">{invoice.member.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.partner.name}</div>
                            <div className="text-sm text-muted-foreground">{invoice.partner.code}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusLabels[invoice.status]?.variant || 'secondary'}>
                            {statusLabels[invoice.status]?.label || invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                        <TableCell className={overdue ? 'text-red-600 font-medium' : ''}>
                          {formatDate(invoice.dueDate)}
                          {overdue && (
                            <span className="block text-xs">期限超過</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    前へ
                  </Button>
                  <span className="flex items-center px-4">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    次へ
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
