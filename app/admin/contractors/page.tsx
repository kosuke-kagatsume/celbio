'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Building2 } from 'lucide-react';
import Link from 'next/link';
import { currentAdminUser, mockContractors, mockNotifications } from '@/lib/mock-data';

export default function ContractorsPage() {
  const adminNotifications = mockNotifications.filter(n => n.userId === currentAdminUser.id);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newContractorName, setNewContractorName] = useState('');
  const [newMarginRate, setNewMarginRate] = useState('30');

  const handleCreateContractor = () => {
    if (!newContractorName.trim()) {
      alert('工務店名を入力してください');
      return;
    }
    alert(`工務店「${newContractorName}」を登録しました（粗利率: ${newMarginRate}%）（モック）`);
    setShowNewDialog(false);
    setNewContractorName('');
    setNewMarginRate('30');
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

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">工務店管理</h1>
            <p className="text-gray-500 mt-1">登録工務店の一覧と管理</p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </div>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録工務店数</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockContractors.length}社</div>
              <p className="text-xs text-muted-foreground">
                累計登録数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均粗利率</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(mockContractors.reduce((sum, c) => sum + c.marginRate, 0) / mockContractors.length * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                全工務店の平均
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の登録</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0社</div>
              <p className="text-xs text-muted-foreground">
                新規登録
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 工務店一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>登録工務店一覧</CardTitle>
            <CardDescription>登録されている工務店の情報</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工務店名</TableHead>
                  <TableHead>粗利率</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockContractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-100 p-2 rounded">
                          <Building2 className="h-4 w-4 text-orange-600" />
                        </div>
                        {contractor.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-orange-600">
                        {(contractor.marginRate * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(contractor.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        編集
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* 新規登録ダイアログ */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規工務店登録</DialogTitle>
            <DialogDescription>
              工務店の情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                工務店名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="例: 山田工務店"
                value={newContractorName}
                onChange={(e) => setNewContractorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginRate">
                粗利率 <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="marginRate"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={newMarginRate}
                  onChange={(e) => setNewMarginRate(e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center px-3 bg-gray-100 rounded-md text-gray-600">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500">
                見積金額に加算される利益率（例: 30% = 原価に30%の利益を上乗せ）
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateContractor}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!newContractorName.trim()}
            >
              登録する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
