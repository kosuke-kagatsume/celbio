'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, User, ArrowLeft } from 'lucide-react';
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

interface MessageThreadProps {
  thread: Thread;
  currentUserId: string;
  backUrl: string;
  onRefresh?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'セリビオ',
  member: '加盟店',
  partner: 'メーカー',
};

export function MessageThread({ thread, currentUserId, backUrl, onRefresh }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages]);

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
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/${thread.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        onRefresh?.();
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

  const getThreadTitle = () => {
    if (thread.subject) return thread.subject;
    if (thread.order) return `発注 ${thread.order.orderNumber} に関するお問い合わせ`;
    if (thread.quote) return `見積 ${thread.quote.quoteNumber} に関するお問い合わせ`;
    return 'お問い合わせ';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href={backUrl}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{getThreadTitle()}</h1>
            <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>
              {thread.status === 'open' ? 'オープン' : 'クローズ'}
            </Badge>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {thread.member && <span>加盟店: {thread.member.name}</span>}
            {thread.partner && <span>メーカー: {thread.partner.name}</span>}
          </div>
        </div>
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
              <div ref={messagesEndRef} />
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
