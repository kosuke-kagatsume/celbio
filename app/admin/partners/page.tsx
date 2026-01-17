import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Factory, Edit, Eye, Package } from 'lucide-react';
import Link from 'next/link';

export default async function PartnersPage() {
  // データベースからメーカー一覧を取得
  const partners = await prisma.partner.findMany({
    include: {
      users: true,
      _count: {
        select: {
          products: true,
          quoteItems: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">メーカー管理</h1>
          <p className="text-gray-500 mt-1">取引先メーカー・パートナーの管理</p>
        </div>
        <Link href="/admin/partners/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            新規メーカー登録
          </Button>
        </Link>
      </div>

      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総メーカー数</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}社</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
            <Factory className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.filter((p) => p.isActive).length}社
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">登録商材数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.reduce((acc, p) => acc + p._count.products, 0)}件
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 一覧テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>メーカー一覧</CardTitle>
          <CardDescription>登録されているメーカーの一覧</CardDescription>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>メーカーが登録されていません</p>
              <Link href="/admin/partners/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  最初のメーカーを登録
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メーカー名</TableHead>
                  <TableHead>コード</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>登録商材</TableHead>
                  <TableHead>取引件数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.code}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{partner.email}</p>
                        <p className="text-gray-500">{partner.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{partner._count.products}件</Badge>
                    </TableCell>
                    <TableCell>{partner._count.quoteItems}件</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          partner.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {partner.isActive ? 'アクティブ' : '停止中'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/partners/${partner.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/partners/${partner.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
