'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, FileText, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { currentUser, mockQuotes, mockNotifications } from '@/lib/mock-data';
import { QuoteStatus } from '@/lib/types';

const statusConfig: Record<QuoteStatus, { color: string; icon: React.ReactNode }> = {
  '依頼受付': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
  '見積中': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  '見積完了': { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
};

export default function ContractorDashboardPage() {
  // 現在のユーザーの工務店の見積のみ表示
  const userQuotes = mockQuotes.filter(q => q.contractorId === currentUser.contractorId);
  const userNotifications = mockNotifications.filter(n => n.userId === currentUser.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} notifications={userNotifications} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">見積依頼一覧</h1>
            <p className="text-gray-500 mt-1">太陽光発電システムの見積管理</p>
          </div>
          <Link href="/contractor/new-quote">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              新規見積依頼
            </Button>
          </Link>
        </div>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総依頼数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userQuotes.length}件</div>
              <p className="text-xs text-muted-foreground">
                累計依頼数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">見積中</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userQuotes.filter(q => q.status === '見積中' || q.status === '依頼受付').length}件
              </div>
              <p className="text-xs text-muted-foreground">
                対応中の依頼
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">完了済み</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userQuotes.filter(q => q.status === '見積完了').length}件
              </div>
              <p className="text-xs text-muted-foreground">
                見積完了
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 見積一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>見積依頼履歴</CardTitle>
            <CardDescription>これまでの見積依頼の状況を確認できます</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>依頼日</TableHead>
                  <TableHead>案件名</TableHead>
                  <TableHead>工事範囲</TableHead>
                  <TableHead>容量</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      見積依頼がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  userQuotes.map((quote) => {
                    const config = statusConfig[quote.status];
                    return (
                      <TableRow key={quote.id}>
                        <TableCell>
                          {new Date(quote.createdAt).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {quote.address.split('県')[1]?.split('市')[0] || quote.address.slice(0, 10)}案件
                        </TableCell>
                        <TableCell>{quote.workScope}</TableCell>
                        <TableCell>{quote.desiredCapacity}</TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {quote.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/contractor/quotes/${quote.id}`}>
                            <Button variant="ghost" size="sm">
                              詳細
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
