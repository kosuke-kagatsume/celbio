'use client';

import { useEffect, useState } from 'react';
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
import { CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Payment {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    partner: { id: string; name: string };
    order: { id: string; orderNumber: string };
  } | null;
  bundle: {
    id: string;
    bundleNumber: string;
    totalAmount: string;
    bundleInvoices: Array<{
      invoice: { id: string; invoiceNumber: string };
    }>;
  } | null;
}

interface PaymentData {
  payments: Payment[];
  summary: { totalAmount: number; count: number };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MemberPaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    fetchPayments();
  }, [selectedYear, selectedMonth]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear !== 'all') {
        params.append('year', selectedYear);
      }
      if (selectedMonth !== 'all') {
        params.append('month', selectedMonth);
      }

      const response = await fetch(`/api/payments?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">入金履歴</h1>
          <p className="text-muted-foreground">支払い済みの履歴確認</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="年" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全期間</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="月" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全月</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {m}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* サマリーカード */}
      {data && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">期間合計</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalAmount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.summary.count}件
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            入金履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              入金履歴がありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>入金日</TableHead>
                  <TableHead>対象</TableHead>
                  <TableHead>メーカー</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      {payment.invoice && (
                        <div>
                          <Link
                            href={`/member/invoices/${payment.invoice.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {payment.invoice.invoiceNumber}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            発注: {payment.invoice.order.orderNumber}
                          </div>
                        </div>
                      )}
                      {payment.bundle && (
                        <div>
                          <span className="font-medium">{payment.bundle.bundleNumber}</span>
                          <div className="text-xs text-muted-foreground">
                            おまとめ（{payment.bundle.bundleInvoices.length}件）
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.invoice?.partner.name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">支払済み</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
