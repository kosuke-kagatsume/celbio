'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Receipt,
  CreditCard,
  Building2,
  Factory,
  Loader2,
} from 'lucide-react';

interface ReportData {
  period: { year: number; month: number | null };
  summary: {
    totalOrders: number;
    totalOrderAmount: number;
    totalInvoices: number;
    totalInvoiceAmount: number;
    totalPayments: number;
    totalPaymentAmount: number;
    activeMembers: number;
    activePartners: number;
  };
  memberStats: Array<{
    id: string;
    name: string;
    orders: number;
    amount: number;
    payments: number;
  }>;
  partnerStats: Array<{
    id: string;
    name: string;
    invoices: number;
    amount: number;
  }>;
  monthlyData: Array<{
    month: number;
    orders: number;
    orderAmount: number;
    invoices: number;
    invoiceAmount: number;
    payments: number;
    paymentAmount: number;
  }>;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', selectedYear);
      if (selectedMonth !== 'all') {
        params.append('month', selectedMonth);
      }

      const response = await fetch(`/api/admin/reports?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">レポート</h1>
          <p className="text-muted-foreground">売上・入金の集計レポート</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="年" />
            </SelectTrigger>
            <SelectContent>
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
              <SelectItem value="all">年間</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {m}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {data && (
        <>
          {/* サマリーカード */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">発注件数</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalOrders}件</div>
                <p className="text-xs text-muted-foreground">
                  合計 {formatCurrency(data.summary.totalOrderAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">請求件数</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalInvoices}件</div>
                <p className="text-xs text-muted-foreground">
                  合計 {formatCurrency(data.summary.totalInvoiceAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">入金件数</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalPayments}件</div>
                <p className="text-xs text-muted-foreground">
                  合計 {formatCurrency(data.summary.totalPaymentAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">登録数</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.activeMembers + data.summary.activePartners}
                </div>
                <p className="text-xs text-muted-foreground">
                  加盟店 {data.summary.activeMembers} / メーカー {data.summary.activePartners}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 月別推移（年間表示時のみ） */}
          {selectedMonth === 'all' && data.monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  月別推移
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>月</TableHead>
                      <TableHead className="text-right">発注件数</TableHead>
                      <TableHead className="text-right">発注金額</TableHead>
                      <TableHead className="text-right">請求件数</TableHead>
                      <TableHead className="text-right">請求金額</TableHead>
                      <TableHead className="text-right">入金件数</TableHead>
                      <TableHead className="text-right">入金金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthlyData.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell>{m.month}月</TableCell>
                        <TableCell className="text-right">{m.orders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.orderAmount)}</TableCell>
                        <TableCell className="text-right">{m.invoices}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.invoiceAmount)}</TableCell>
                        <TableCell className="text-right">{m.payments}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.paymentAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 加盟店別集計 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                加盟店別集計
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.memberStats.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  データがありません
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>加盟店</TableHead>
                      <TableHead className="text-right">発注件数</TableHead>
                      <TableHead className="text-right">発注金額</TableHead>
                      <TableHead className="text-right">入金金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.memberStats.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-right">{m.orders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.payments)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* メーカー別集計 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                メーカー別集計
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.partnerStats.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  データがありません
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>メーカー</TableHead>
                      <TableHead className="text-right">請求件数</TableHead>
                      <TableHead className="text-right">請求金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.partnerStats.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.invoices}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
