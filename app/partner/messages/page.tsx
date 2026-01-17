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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Loader2, Eye } from 'lucide-react';

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

export default function PartnerMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messages');
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

  const handleCreate = async () => {
    if (!newMessage.trim()) {
      alert('メッセージを入力してください');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject || null,
          threadType: 'inquiry',
          message: newMessage,
        }),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewSubject('');
        setNewMessage('');
        fetchThreads();
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('エラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">問い合わせ</h1>
          <p className="text-muted-foreground">セリビオへのお問い合わせ</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規問い合わせ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規問い合わせ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">件名（任意）</Label>
                <Input
                  id="subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="お問い合わせ内容の件名"
                />
              </div>
              <div>
                <Label htmlFor="message">メッセージ</Label>
                <Textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="お問い合わせ内容を入力してください"
                  rows={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !newMessage.trim()}>
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  送信
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            問い合わせ一覧
          </CardTitle>
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
                  <TableHead>ステータス</TableHead>
                  <TableHead>メッセージ数</TableHead>
                  <TableHead>最終更新</TableHead>
                  <TableHead>最新メッセージ</TableHead>
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
                      <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>
                        {thread.status === 'open' ? 'オープン' : 'クローズ'}
                      </Badge>
                    </TableCell>
                    <TableCell>{thread._count.messages}</TableCell>
                    <TableCell>{formatDate(thread.updatedAt)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {thread.messages[0]?.content || '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/partner/messages/${thread.id}`}>
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
