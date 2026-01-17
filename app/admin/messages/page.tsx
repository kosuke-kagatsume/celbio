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
import { MessageSquare, Loader2, Eye, Building2, Factory } from 'lucide-react';

interface Thread {
  id: string;
  subject: string | null;
  threadType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  order: { id: string; orderNumber: string } | null;
  quote: { id: string; quoteNumber: string } | null;
  member: { id: string; name: string } | null;
  partner: { id: string; name: string } | null;
  messages: Array<{
    id: string;
    content: string;
    sender: { id: string; name: string };
  }>;
  _count: { messages: number };
}

const threadTypeLabels: Record<string, string> = {
  order: '発注',
  quote: '見積',
  inquiry: '問い合わせ',
};

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchThreads();
  }, [statusFilter, typeFilter]);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      const response = await fetch(`/api/messages?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getThreadTitle = (thread: Thread) => {
    if (thread.subject) return thread.subject;
    if (thread.order) return `発注 ${thread.order.orderNumber}`;
    if (thread.quote) return `見積 ${thread.quote.quoteNumber}`;
    return 'お問い合わせ';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">問い合わせ管理</h1>
        <p className="text-muted-foreground">すべての問い合わせの確認と対応</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              問い合わせ一覧
            </CardTitle>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="種類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="order">発注</SelectItem>
                  <SelectItem value="quote">見積</SelectItem>
                  <SelectItem value="inquiry">問い合わせ</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="open">オープン</SelectItem>
                  <SelectItem value="closed">クローズ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              問い合わせがありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>件名</TableHead>
                  <TableHead>種類</TableHead>
                  <TableHead>送信元</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>メッセージ数</TableHead>
                  <TableHead>最終更新</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {threads.map((thread) => (
                  <TableRow key={thread.id}>
                    <TableCell className="font-medium">
                      {getThreadTitle(thread)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {threadTypeLabels[thread.threadType] || thread.threadType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {thread.member && (
                          <>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{thread.member.name}</span>
                          </>
                        )}
                        {thread.partner && (
                          <>
                            <Factory className="h-4 w-4 text-muted-foreground" />
                            <span>{thread.partner.name}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>
                        {thread.status === 'open' ? 'オープン' : 'クローズ'}
                      </Badge>
                    </TableCell>
                    <TableCell>{thread._count.messages}</TableCell>
                    <TableCell>{formatDate(thread.updatedAt)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/messages/${thread.id}`}>
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
