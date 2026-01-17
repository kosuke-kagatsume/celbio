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
import { Textarea } from '@/components/ui/textarea';
import { Building2, Upload, Loader2, Check, X, Zap } from 'lucide-react';

interface BankTransaction {
  id: string;
  transactionDate: string;
  senderName: string;
  senderNameKana: string | null;
  amount: string;
  balance: string | null;
  description: string | null;
  matched: boolean;
  payments: Array<{
    id: string;
    invoice: { id: string; invoiceNumber: string } | null;
    bundle: { id: string; bundleNumber: string } | null;
  }>;
}

export default function BankTransactionsPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [matchedFilter, setMatchedFilter] = useState<string>('all');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [autoMatchResult, setAutoMatchResult] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [matchedFilter, page]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (matchedFilter !== 'all') {
        params.append('matched', matchedFilter);
      }
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/admin/bank-transactions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
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

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    // ヘッダー行をスキップ
    const dataLines = lines.slice(1);

    return dataLines.map((line) => {
      const cols = line.split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
      // CSV形式: 日付, 振込人名義, 振込人名義カナ, 金額, 残高, 摘要
      return {
        transactionDate: cols[0],
        senderName: cols[1],
        senderNameKana: cols[2] || null,
        amount: cols[3],
        balance: cols[4] || null,
        description: cols[5] || null,
      };
    }).filter((t) => t.transactionDate && t.senderName && t.amount);
  };

  const handleAutoMatch = async () => {
    setIsAutoMatching(true);
    setAutoMatchResult(null);
    try {
      const response = await fetch('/api/admin/payments/auto-match', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setAutoMatchResult(result.message);
        fetchTransactions();
      } else {
        const error = await response.json();
        setAutoMatchResult(error.error || '自動マッチングに失敗しました');
      }
    } catch (error) {
      console.error('Error auto-matching:', error);
      setAutoMatchResult('自動マッチングに失敗しました');
    } finally {
      setIsAutoMatching(false);
    }
  };

  const handleImport = async () => {
    const transactions = parseCSV(csvData);
    if (transactions.length === 0) {
      setImportResult('有効なデータがありません。CSV形式を確認してください。');
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    try {
      const response = await fetch('/api/admin/bank-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(result.message);
        setCsvData('');
        fetchTransactions();
      } else {
        const error = await response.json();
        setImportResult(error.error || 'インポートに失敗しました');
      }
    } catch (error) {
      console.error('Error importing:', error);
      setImportResult('インポートに失敗しました');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">銀行取引管理</h1>
          <p className="text-muted-foreground">入金データのインポートと確認</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoMatch} disabled={isAutoMatching}>
            {isAutoMatching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            自動マッチング
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                CSVインポート
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>銀行取引インポート</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>CSV形式</Label>
                <p className="text-sm text-muted-foreground">
                  日付, 振込人名義, 振込人名義カナ, 金額, 残高, 摘要
                </p>
              </div>
              <div>
                <Label htmlFor="csv">CSVデータ</Label>
                <Textarea
                  id="csv"
                  placeholder="日付,振込人名義,振込人名義カナ,金額,残高,摘要&#10;2024-01-15,山田工務店,ヤマダコウムテン,150000,1000000,振込"
                  rows={10}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                />
              </div>
              {importResult && (
                <div className={`p-3 rounded ${importResult.includes('失敗') || importResult.includes('ありません') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {importResult}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleImport} disabled={isImporting || !csvData.trim()}>
                  {isImporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  インポート
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {autoMatchResult && (
        <div className={`p-4 rounded-lg ${autoMatchResult.includes('失敗') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {autoMatchResult}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              取引一覧
            </CardTitle>
            <Select value={matchedFilter} onValueChange={setMatchedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="false">未マッチ</SelectItem>
                <SelectItem value="true">マッチ済み</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              取引データがありません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>取引日</TableHead>
                    <TableHead>振込人名義</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>マッチ先</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{formatDate(txn.transactionDate)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{txn.senderName}</div>
                          {txn.senderNameKana && (
                            <div className="text-sm text-muted-foreground">
                              {txn.senderNameKana}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell>
                        {txn.matched ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            マッチ済み
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <X className="h-3 w-3" />
                            未マッチ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {txn.payments.map((p) => (
                          <div key={p.id} className="text-sm">
                            {p.invoice && `請求書: ${p.invoice.invoiceNumber}`}
                            {p.bundle && `おまとめ: ${p.bundle.bundleNumber}`}
                          </div>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
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
