'use client';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, CheckCircle2, Building2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { currentAdminUser, mockQuotes, mockNotifications } from '@/lib/mock-data';
import { QuoteStatus } from '@/lib/types';

const statusConfig: Record<QuoteStatus, { color: string; icon: React.ReactNode }> = {
  '依頼受付': { color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="h-4 w-4" /> },
  '見積中': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  '見積完了': { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
};

export default function AdminDashboardPage() {
  const adminNotifications = mockNotifications.filter(n => n.userId === currentAdminUser.id);

  const pendingQuotes = mockQuotes.filter(q => q.status === '依頼受付');
  const inProgressQuotes = mockQuotes.filter(q => q.status === '見積中');
  const completedQuotes = mockQuotes.filter(q => q.status === '見積完了');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentAdminUser} notifications={adminNotifications} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理ダッシュボード</h1>
            <p className="text-gray-500 mt-1">全工務店からの見積依頼を管理</p>
          </div>
          <Link href="/admin/contractors">
            <Button variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              工務店管理
            </Button>
          </Link>
        </div>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総依頼数</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockQuotes.length}件</div>
              <p className="text-xs text-muted-foreground">すべての工務店</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">要確認</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{pendingQuotes.length}件</div>
              <p className="text-xs text-blue-700">承認待ち</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">見積中</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressQuotes.length}件</div>
              <p className="text-xs text-muted-foreground">作成中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">完了済み</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedQuotes.length}件</div>
              <p className="text-xs text-muted-foreground">今月</p>
            </CardContent>
          </Card>
        </div>

        {/* タブで分類された依頼一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>見積依頼一覧</CardTitle>
            <CardDescription>ステータス別に見積依頼を管理</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="relative">
                  依頼受付
                  {pendingQuotes.length > 0 && (
                    <Badge className="ml-2 bg-blue-600">{pendingQuotes.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="in-progress">
                  見積中
                  {inProgressQuotes.length > 0 && (
                    <Badge className="ml-2 bg-yellow-600">{inProgressQuotes.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">完了済み</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                <QuoteTable quotes={pendingQuotes} />
              </TabsContent>

              <TabsContent value="in-progress" className="mt-4">
                <QuoteTable quotes={inProgressQuotes} />
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                <QuoteTable quotes={completedQuotes} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function QuoteTable({ quotes }: { quotes: typeof mockQuotes }) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>該当する見積依頼はありません</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>依頼日</TableHead>
          <TableHead>工務店</TableHead>
          <TableHead>住所</TableHead>
          <TableHead>工事範囲</TableHead>
          <TableHead>容量</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => {
          const config = statusConfig[quote.status];
          return (
            <TableRow key={quote.id}>
              <TableCell>
                {new Date(quote.createdAt).toLocaleDateString('ja-JP')}
              </TableCell>
              <TableCell className="font-medium">{quote.contractorName}</TableCell>
              <TableCell className="max-w-xs truncate">{quote.address}</TableCell>
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
                <Link href={`/admin/quotes/${quote.id}`}>
                  <Button variant="ghost" size="sm">
                    {quote.status === '依頼受付' ? '確認・承認' : '詳細'}
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
