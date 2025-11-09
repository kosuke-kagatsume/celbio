'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Download, FileText, MapPin, Zap, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { currentUser, mockQuotes, mockNotifications, mockComments } from '@/lib/mock-data';
import { QuoteStatus } from '@/lib/types';
import { useState } from 'react';

const statusConfig: Record<QuoteStatus, { color: string; description: string }> = {
  '依頼受付': {
    color: 'bg-blue-100 text-blue-800',
    description: 'セルビオが内容を確認中です',
  },
  '見積中': {
    color: 'bg-yellow-100 text-yellow-800',
    description: 'メーカー・工事会社が見積作成中です',
  },
  '見積完了': {
    color: 'bg-green-100 text-green-800',
    description: '見積が完成しました',
  },
};

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const quote = mockQuotes.find((q) => q.id === params.id);
  const userNotifications = mockNotifications.filter((n) => n.userId === currentUser.id);
  const quoteComments = quote ? mockComments.filter((c) => c.quoteId === quote.id) : [];
  const [newComment, setNewComment] = useState('');

  if (!quote) {
    return <div>見積が見つかりません</div>;
  }

  const config = statusConfig[quote.status];

  const handleSendComment = () => {
    alert(`コメントを送信しました: ${newComment}（モック）`);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} notifications={userNotifications} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/contractor/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            見積一覧に戻る
          </Button>
        </Link>

        {/* ステータス */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">見積詳細</h1>
            <Badge className={`${config.color} text-base px-4 py-2`}>
              {quote.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-2">{config.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側: 見積情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">依頼日</p>
                    <p className="font-medium">
                      {new Date(quote.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">依頼者</p>
                    <p className="font-medium">{quote.userName}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">建築地住所</p>
                      <p className="font-medium">{quote.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">工事範囲</p>
                      <p className="font-medium">{quote.workScope}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">希望容量</p>
                      <p className="font-medium">{quote.desiredCapacity}</p>
                    </div>
                  </div>
                </div>

                {quote.comment && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">コメント</p>
                      <p className="text-gray-700">{quote.comment}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* アップロードファイル */}
            <Card>
              <CardHeader>
                <CardTitle>アップロード資料</CardTitle>
                <CardDescription>提出した資料一覧</CardDescription>
              </CardHeader>
              <CardContent>
                {quote.files.length === 0 ? (
                  <p className="text-sm text-gray-500">資料がアップロードされていません</p>
                ) : (
                  <div className="space-y-2">
                    {quote.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-100 p-2 rounded">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.fileName}</p>
                            <p className="text-xs text-gray-500">{file.fileType}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 見積書ダウンロード */}
            {quote.status === '見積完了' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">見積書</CardTitle>
                  <CardDescription className="text-green-700">
                    見積が完成しました。ダウンロードしてご確認ください。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" />
                    見積書をダウンロード (PDF)
                  </Button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    有効期限: 30日間
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側: コメント */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  コメント
                </CardTitle>
                <CardDescription>セルビオとのやり取り</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {quoteComments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      コメントはありません
                    </p>
                  ) : (
                    quoteComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg ${
                          comment.userRole === 'admin'
                            ? 'bg-orange-50 border border-orange-100'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold">{comment.userName}</p>
                          <Badge
                            variant="outline"
                            className={
                              comment.userRole === 'admin'
                                ? 'bg-orange-100 text-orange-700 border-orange-200'
                                : ''
                            }
                          >
                            {comment.userRole === 'admin' ? '管理者' : '工務店'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(comment.createdAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Textarea
                    placeholder="コメントを入力..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleSendComment}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={!newComment.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    送信
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
