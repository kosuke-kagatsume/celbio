'use client';

import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Download,
  FileText,
  MapPin,
  Zap,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { currentAdminUser, mockQuotes, mockNotifications, mockComments } from '@/lib/mock-data';
import { QuoteStatus } from '@/lib/types';

const statusConfig: Record<QuoteStatus, { color: string; description: string }> = {
  '依頼受付': {
    color: 'bg-blue-100 text-blue-800',
    description: '内容を確認して承認または差し戻してください',
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

export default function AdminQuoteDetailPage({ params }: { params: { id: string } }) {
  const quote = mockQuotes.find((q) => q.id === params.id);
  const adminNotifications = mockNotifications.filter((n) => n.userId === currentAdminUser.id);
  const quoteComments = quote ? mockComments.filter((c) => c.quoteId === quote.id) : [];

  const [newComment, setNewComment] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!quote) {
    return <div>見積が見つかりません</div>;
  }

  const config = statusConfig[quote.status];

  const handleSendComment = () => {
    alert(`コメントを送信しました: ${newComment}（モック）`);
    setNewComment('');
  };

  const handleApprove = () => {
    alert('承認しました！ダンドリワークへ送信します。（モック）');
    setShowApproveDialog(false);
    window.location.reload();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('差し戻し理由を入力してください');
      return;
    }
    alert(`差し戻しました。理由: ${rejectReason}（モック）`);
    setShowRejectDialog(false);
    setRejectReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentAdminUser} notifications={adminNotifications} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ダッシュボードに戻る
          </Button>
        </Link>

        {/* ステータス */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">見積依頼詳細</h1>
            <Badge className={`${config.color} text-base px-4 py-2`}>
              {quote.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-2">{config.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側: 見積情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 工務店情報 */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Building2 className="h-5 w-5" />
                  工務店情報
                </CardTitle>
              </CardHeader>
              <CardContent className="text-orange-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-orange-700">工務店名</p>
                    <p className="font-semibold">{quote.contractorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-orange-700">担当者</p>
                    <p className="font-semibold">{quote.userName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>依頼内容</CardTitle>
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
                    <p className="text-sm text-gray-500">最終更新</p>
                    <p className="font-medium">
                      {new Date(quote.updatedAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">建築地住所</p>
                      <p className="font-medium">{quote.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">工事範囲</p>
                      <p className="font-medium">{quote.workScope}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
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
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">{quote.comment}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* アップロードファイル */}
            <Card>
              <CardHeader>
                <CardTitle>アップロード資料</CardTitle>
                <CardDescription>工務店から提出された資料</CardDescription>
              </CardHeader>
              <CardContent>
                {quote.files.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">資料がアップロードされていません</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quote.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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

            {/* 承認・差し戻しボタン */}
            {quote.status === '依頼受付' && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setShowRejectDialog(true)}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      差し戻し
                    </Button>
                    <Button
                      onClick={() => setShowApproveDialog(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      承認してダンドリワークへ送信
                    </Button>
                  </div>
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
                <CardDescription>工務店とのやり取り</CardDescription>
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

      {/* 承認確認ダイアログ */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>見積依頼を承認しますか？</DialogTitle>
            <DialogDescription>
              承認すると、ダンドリワークAPI経由でメーカーと電気工事会社へ情報が送信されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm"><strong>工務店:</strong> {quote.contractorName}</p>
              <p className="text-sm"><strong>住所:</strong> {quote.address}</p>
              <p className="text-sm"><strong>工事範囲:</strong> {quote.workScope}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              承認する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 差し戻しダイアログ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>見積依頼を差し戻しますか？</DialogTitle>
            <DialogDescription>
              差し戻し理由を入力してください。工務店に通知されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="例: 立面図が不足しています。追加でアップロードしてください。"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
            >
              差し戻す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
