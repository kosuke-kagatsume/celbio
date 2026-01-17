'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Receipt, Eye, Loader2, FileStack } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  order: { id: string; orderNumber: string };
  partner: { id: string; name: string; code: string };
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  issued: { label: '未払い', variant: 'destructive' },
  sent: { label: '未払い', variant: 'destructive' },
  paid: { label: '支払済み', variant: 'default' },
};

export default function MemberInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreatingBundle, setIsCreatingBundle] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
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

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(parseFloat(amount));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const unpaidIds = invoices
      .filter((inv) => inv.status !== 'paid')
      .map((inv) => inv.id);
    setSelectedIds(unpaidIds);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const createBundle = async () => {
    if (selectedIds.length === 0) {
      alert('請求書を選択してください');
      return;
    }

    setIsCreatingBundle(true);
    try {
      const response = await fetch('/api/invoices/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: selectedIds }),
      });

      if (response.ok) {
        const bundle = await response.json();
        alert(`おまとめを作成しました: ${bundle.bundleNumber}`);
        setSelectedIds([]);
        fetchInvoices();
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating bundle:', error);
      alert('エラーが発生しました');
    } finally {
      setIsCreatingBundle(false);
    }
  };

  const selectedTotal = invoices
    .filter((inv) => selectedIds.includes(inv.id))
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);

  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'paid');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">請求書一覧</h1>
        <p className="text-muted-foreground">受領した請求書の確認</p>
      </div>

      {/* おまとめ操作パネル */}
      {unpaidInvoices.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  全て選択
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  選択解除
                </Button>
                {selectedIds.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length}件選択中 / 合計: {formatCurrency(selectedTotal.toString())}
                  </span>
                )}
              </div>
              <Button
                onClick={createBundle}
                disabled={selectedIds.length === 0 || isCreatingBundle}
              >
                {isCreatingBundle ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileStack className="mr-2 h-4 w-4" />
                )}
                おまとめ作成
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              請求書一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="issued">未払い</SelectItem>
                <SelectItem value="paid">支払済み</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>請求書番号</TableHead>
                  <TableHead>発注番号</TableHead>
                  <TableHead>メーカー</TableHead>
                  <TableHead className="text-right">税込金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>発行日</TableHead>
                  <TableHead>支払期限</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {invoice.status !== 'paid' && (
                        <Checkbox
                          checked={selectedIds.includes(invoice.id)}
                          onCheckedChange={() => toggleSelect(invoice.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/member/orders/${invoice.order.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {invoice.order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.partner.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[invoice.status]?.variant || 'secondary'}>
                        {statusLabels[invoice.status]?.label || invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                    <TableCell>
                      {invoice.dueDate && (
                        <span
                          className={
                            new Date(invoice.dueDate) < new Date() &&
                            invoice.status !== 'paid'
                              ? 'text-red-600 font-medium'
                              : ''
                          }
                        >
                          {formatDate(invoice.dueDate)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/member/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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
  );
}
