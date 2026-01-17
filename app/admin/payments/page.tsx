'use client';

import { useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Plus, Loader2, Check, AlertCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: string;
  status: string;
  matchType: string;
  difference: string | null;
  note: string | null;
  approvedAt: string | null;
  createdAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    member: { id: string; name: string };
    partner: { id: string; name: string };
    order: { id: string; orderNumber: string };
  } | null;
  bundle: {
    id: string;
    bundleNumber: string;
    totalAmount: string;
    member: { id: string; name: string };
  } | null;
  bankTransaction: {
    id: string;
    senderName: string;
    transactionDate: string;
  } | null;
  approver: { id: string; name: string } | null;
}

interface UnmatchedTransaction {
  id: string;
  senderName: string;
  amount: string;
  transactionDate: string;
}

interface UnpaidInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  member: { name: string };
}

interface UnpaidBundle {
  id: string;
  bundleNumber: string;
  totalAmount: string;
  member: { name: string };
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '差異確認中', variant: 'secondary' },
  matched: { label: 'マッチ', variant: 'default' },
  approved: { label: '承認済み', variant: 'default' },
  rejected: { label: '却下', variant: 'destructive' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 手動マッチング用
  const [unmatchedTxns, setUnmatchedTxns] = useState<UnmatchedTransaction[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [unpaidBundles, setUnpaidBundles] = useState<UnpaidBundle[]>([]);
  const [selectedTxnId, setSelectedTxnId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedBundleId, setSelectedBundleId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, page]);

  useEffect(() => {
    if (isCreateDialogOpen) {
      fetchUnmatchedData();
    }
  }, [isCreateDialogOpen]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnmatchedData = async () => {
    try {
      const [txnRes, invRes, bundleRes] = await Promise.all([
        fetch('/api/admin/bank-transactions?matched=false&limit=100'),
        fetch('/api/admin/invoices/unpaid'),
        fetch('/api/admin/bundles/unpaid'),
      ]);

      if (txnRes.ok) {
        const data = await txnRes.json();
        setUnmatchedTxns(data.transactions || []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setUnpaidInvoices(data.invoices || []);
      }
      if (bundleRes.ok) {
        const data = await bundleRes.json();
        setUnpaidBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching unmatched data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(parseFloat(amount));
  };

  const handleCreatePayment = async () => {
    if (!selectedInvoiceId && !selectedBundleId) {
      alert('請求書またはおまとめを選択してください');
      return;
    }

    const selectedTxn = unmatchedTxns.find((t) => t.id === selectedTxnId);
    const amount = selectedTxn ? selectedTxn.amount : manualAmount;

    if (!amount) {
      alert('金額を入力してください');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId || null,
          bundleId: selectedBundleId || null,
          bankTxnId: selectedTxnId || null,
          amount,
          note,
        }),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchPayments();
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('エラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedTxnId('');
    setSelectedInvoiceId('');
    setSelectedBundleId('');
    setManualAmount('');
    setNote('');
  };

  const handleApprove = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchPayments();
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">入金管理</h1>
          <p className="text-muted-foreground">入金消込と差異承認</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              手動マッチング
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>手動入金マッチング</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>銀行取引（任意）</Label>
                <Select value={selectedTxnId} onValueChange={setSelectedTxnId}>
                  <SelectTrigger>
                    <SelectValue placeholder="未マッチの取引を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">選択なし（手動入力）</SelectItem>
                    {unmatchedTxns.map((txn) => (
                      <SelectItem key={txn.id} value={txn.id}>
                        {formatDate(txn.transactionDate)} - {txn.senderName} - {formatCurrency(txn.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedTxnId && (
                <div>
                  <Label htmlFor="amount">入金額</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="金額を入力"
                  />
                </div>
              )}

              <div>
                <Label>請求書</Label>
                <Select
                  value={selectedInvoiceId}
                  onValueChange={(v) => {
                    setSelectedInvoiceId(v);
                    if (v) setSelectedBundleId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請求書を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">選択なし</SelectItem>
                    {unpaidInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.member.name} - {formatCurrency(inv.totalAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>おまとめ</Label>
                <Select
                  value={selectedBundleId}
                  onValueChange={(v) => {
                    setSelectedBundleId(v);
                    if (v) setSelectedInvoiceId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="おまとめを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">選択なし</SelectItem>
                    {unpaidBundles.map((bundle) => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.bundleNumber} - {bundle.member.name} - {formatCurrency(bundle.totalAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="note">備考</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="備考（差異がある場合の理由など）"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreatePayment} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  登録
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              入金一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="pending">差異確認中</SelectItem>
                <SelectItem value="matched">マッチ</SelectItem>
                <SelectItem value="approved">承認済み</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              入金データがありません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>対象</TableHead>
                    <TableHead>加盟店</TableHead>
                    <TableHead className="text-right">請求額</TableHead>
                    <TableHead className="text-right">入金額</TableHead>
                    <TableHead className="text-right">差異</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>登録日</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const targetAmount = payment.invoice
                      ? payment.invoice.totalAmount
                      : payment.bundle
                      ? payment.bundle.totalAmount
                      : '0';

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.invoice && (
                            <div>
                              <div className="font-medium">{payment.invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {payment.invoice.partner.name}
                              </div>
                            </div>
                          )}
                          {payment.bundle && (
                            <div>
                              <div className="font-medium">{payment.bundle.bundleNumber}</div>
                              <div className="text-sm text-muted-foreground">おまとめ</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.invoice?.member.name || payment.bundle?.member.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(targetAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.difference && (
                            <span
                              className={
                                parseFloat(payment.difference) > 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {parseFloat(payment.difference) > 0 ? '+' : ''}
                              {formatCurrency(payment.difference)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusLabels[payment.status]?.variant || 'secondary'}
                            className="gap-1"
                          >
                            {payment.status === 'pending' && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {payment.status === 'approved' && <Check className="h-3 w-3" />}
                            {statusLabels[payment.status]?.label || payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>
                          {payment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(payment.id)}
                            >
                              承認
                            </Button>
                          )}
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
