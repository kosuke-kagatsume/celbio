'use client';

import { useEffect, useState, use } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, User, ArrowLeft, X, Building2, Factory } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  files: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
}

interface Thread {
  id: string;
  subject: string | null;
  threadType: string;
  status: string;
  createdAt: string;
  order: { id: string; orderNumber: string } | null;
  quote: { id: string; quoteNumber: string } | null;
  member: { id: string; name: string } | null;
  partner: { id: string; name: string } | null;
  messages: Message[];
}

const roleLabels: Record<string, string> = {
  admin: 'セリビオ',
  member: '加盟店',
  partner: 'メーカー',
};

export default function AdminMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [thread, setThread] = useState<Thread | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    fetchThread();
    fetchCurrentUser();
  }, [id]);

  const fetchThread = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages/${id}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !thread) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/${thread.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchThread();
      } else {
        const error = await response.json();
        alert(error.error || '送信に失敗しました');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!thread || !confirm('このスレッドをクローズしますか？')) return;

    setIsClosing(true);
    try {
      const response = await fetch(`/api/messages/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (response.ok) {
        fetchThread();
      } else {
        const error = await response.json();
        alert(error.error || 'クローズに失敗しました');
      }
    } catch (error) {
      console.error('Error closing thread:', error);
      alert('クローズに失敗しました');
    } finally {
      setIsClosing(false);
    }
  };

  const getThreadTitle = () => {
    if (!thread) return '';
    if (thread.subject) return thread.subject;
    if (thread.order) return `発注 ${thread.order.orderNumber} に関するお問い合わせ`;
    if (thread.quote) return `見積 ${thread.quote.quoteNumber} に関するお問い合わせ`;
    return 'お問い合わせ';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        スレッドが見つかりません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/messages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{getThreadTitle()}</h1>
              <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>
                {thread.status === 'open' ? 'オープン' : 'クローズ'}
              </Badge>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {thread.member && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {thread.member.name}
                </span>
              )}
              {thread.partner && (
                <span className="flex items-center gap-1">
                  <Factory className="h-3 w-3" />
                  {thread.partner.name}
                </span>
              )}
            </div>
          </div>
        </div>
        {thread.status === 'open' && (
          <Button variant="outline" onClick={handleClose} disabled={isClosing}>
            {isClosing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            クローズ
          </Button>
        )}
      </div>

      <Card className="flex flex-col h-[calc(100vh-250px)]">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base">メッセージ</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {thread.messages.map((message) => {
                const isOwn = message.sender.id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100'
                      } rounded-lg p-3`}
                    >
                      <div className={`text-xs mb-1 flex items-center gap-1 ${isOwn ? 'text-blue-100' : 'text-muted-foreground'}`}>
                        <User className="h-3 w-3" />
                        <span>{message.sender.name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${isOwn ? 'border-blue-300 text-blue-100' : ''}`}>
                          {roleLabels[message.sender.role] || message.sender.role}
                        </Badge>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      {message.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.files.map((file) => (
                            <a
                              key={file.id}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
                            >
                              📎 {file.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 ${isOwn ? 'text-blue-200' : 'text-muted-foreground'}`}>
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {thread.status === 'open' && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="メッセージを入力..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="self-end"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Shift + Enter で改行
              </p>
            </div>
          )}

          {thread.status === 'closed' && (
            <div className="border-t p-4 bg-gray-50 text-center text-muted-foreground">
              このスレッドはクローズされています
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
