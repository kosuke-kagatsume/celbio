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
import { FileText, Eye, Loader2 } from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  desiredDate: string | null;
  createdAt: string;
  member: { id: string; name: string; code: string };
  category: { id: string; name: string };
  items: Array<{
    id: string;
    itemName: string;
    status: string | null;
    partner: { id: string; name: string };
  }>;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  requested: { label: '回答待ち', variant: 'destructive' },
  responded: { label: '回答済み', variant: 'default' },
  approved: { label: '承認済み', variant: 'outline' },
};

export default function PartnerQuotesPage() {
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

  const getMyItemsStatus = (items: Quote['items']) => {
    const pendingCount = items.filter(item => item.status !== 'quoted').length;
    if (pendingCount === 0) return { label: '回答済み', variant: 'default' as const };
    return { label: `${pendingCount}件未回答`, variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">見積依頼一覧</h1>
        <p className="text-muted-foreground">受信した見積依頼の管理・回答</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              見積依頼
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="requested">回答待ち</SelectItem>
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
              見積依頼がありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>見積番号</TableHead>
                  <TableHead>加盟店</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>回答状況</TableHead>
                  <TableHead>希望納期</TableHead>
                  <TableHead>依頼日</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => {
                  const itemStatus = getMyItemsStatus(quote.items);
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        {quote.quoteNumber}
                      </TableCell>
                      <TableCell>{quote.member.name}</TableCell>
                      <TableCell>{quote.title || '-'}</TableCell>
                      <TableCell>{quote.category.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[quote.status]?.variant || 'secondary'}>
                          {statusLabels[quote.status]?.label || quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={itemStatus.variant}>
                          {itemStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(quote.desiredDate)}</TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/partner/quotes/${quote.id}`}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
