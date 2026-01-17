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
import { FileText, Clock, AlertCircle, Eye, Loader2 } from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  totalAmount: string | null;
  createdAt: string;
  member: { id: string; name: string; code: string };
  category: { id: string; name: string };
  items: Array<{ partner: { id: string; name: string } }>;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '下書き', variant: 'secondary' },
  requested: { label: '依頼中', variant: 'default' },
  responded: { label: '回答済み', variant: 'outline' },
  approved: { label: '承認済み', variant: 'default' },
  rejected: { label: '却下', variant: 'destructive' },
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, responded: 0, requested: 0 });

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter, page]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/quotes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes);
        setTotalPages(data.pagination.totalPages);

        // 統計情報を取得（全件のカウント）
        if (statusFilter === 'all' && page === 1) {
          const [respondedRes, requestedRes] = await Promise.all([
            fetch('/api/quotes?status=responded&limit=1'),
            fetch('/api/quotes?status=requested&limit=1'),
          ]);
          const respondedData = await respondedRes.json();
          const requestedData = await requestedRes.json();
          setStats({
            total: data.pagination.total,
            responded: respondedData.pagination.total,
            requested: requestedData.pagination.total,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(parseFloat(amount));
  };

  const getPartnerNames = (items: Quote['items']) => {
    const names = [...new Set(items.map(item => item.partner.name))];
    return names.length > 0 ? names.join(', ') : '-';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">見積管理</h1>
        <p className="text-muted-foreground">全加盟店の見積依頼を一覧・管理</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総見積数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responded}件</div>
            <p className="text-xs text-muted-foreground">回答済み・承認待ち</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">依頼中</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requested}件</div>
            <p className="text-xs text-muted-foreground">メーカー回答待ち</p>
          </CardContent>
        </Card>
      </div>

      {/* 見積一覧 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              見積一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="requested">依頼中</SelectItem>
                <SelectItem value="responded">回答済み</SelectItem>
                <SelectItem value="approved">承認済み</SelectItem>
                <SelectItem value="rejected">却下</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              見積がありません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>見積番号</TableHead>
                    <TableHead>加盟店</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>タイトル</TableHead>
                    <TableHead>メーカー</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        {quote.quoteNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quote.member.name}</div>
                          <div className="text-sm text-muted-foreground">{quote.member.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{quote.category.name}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {quote.title || '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {getPartnerNames(quote.items)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[quote.status]?.variant || 'secondary'}>
                          {statusLabels[quote.status]?.label || quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(quote.totalAmount)}
                      </TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/quotes/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
