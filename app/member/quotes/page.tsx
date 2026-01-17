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
import { Plus, FileText, Eye, Loader2 } from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  totalAmount: string | null;
  desiredDate: string | null;
  createdAt: string;
  category: { id: string; name: string };
  items: Array<{ partner: { name: string } }>;
  _count: { files: number };
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '下書き', variant: 'secondary' },
  requested: { label: '依頼中', variant: 'default' },
  responded: { label: '回答済み', variant: 'outline' },
  approved: { label: '承認済み', variant: 'default' },
  rejected: { label: '却下', variant: 'destructive' },
};

export default function MemberQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await fetch(`/api/quotes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
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
    return names.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">見積一覧</h1>
          <p className="text-muted-foreground">見積依頼の管理</p>
        </div>
        <Link href="/member/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規見積依頼
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              見積一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="requested">依頼中</SelectItem>
                <SelectItem value="responded">回答済み</SelectItem>
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
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              見積がありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>見積番号</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>メーカー</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>希望納期</TableHead>
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
                    <TableCell>{quote.title || '-'}</TableCell>
                    <TableCell>{quote.category.name}</TableCell>
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
                    <TableCell>{formatDate(quote.desiredDate)}</TableCell>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/member/quotes/${quote.id}`}>
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
