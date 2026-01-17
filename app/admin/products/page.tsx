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
import { Plus, Package, Edit, Eye, Tag, Factory } from 'lucide-react';
import Link from 'next/link';

export default async function ProductsPage() {
  // データベースから商材一覧を取得
  const products = await prisma.product.findMany({
    include: {
      category: true,
      partner: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // カテゴリ一覧
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">商材管理</h1>
          <p className="text-gray-500 mt-1">取扱商材・カテゴリの管理</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/categories">
            <Button variant="outline">
              <Tag className="mr-2 h-4 w-4" />
              カテゴリ管理
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              新規商材登録
            </Button>
          </Link>
        </div>
      </div>

      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総商材数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type A（即時発注）</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => p.productType === 'TYPE_A').length}件
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type B（見積必要）</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => p.productType === 'TYPE_B').length}件
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">カテゴリ数</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}件</div>
          </CardContent>
        </Card>
      </div>

      {/* カテゴリ別タグ */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
          すべて ({products.length})
        </Badge>
        {categories.map((cat) => (
          <Badge key={cat.id} variant="outline" className="cursor-pointer hover:bg-gray-100">
            {cat.name} ({cat._count.products})
          </Badge>
        ))}
      </div>

      {/* 一覧テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>商材一覧</CardTitle>
          <CardDescription>登録されている商材の一覧</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>商材が登録されていません</p>
              <Link href="/admin/products/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  最初の商材を登録
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商材名</TableHead>
                  <TableHead>コード</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>メーカー</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>単価</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category?.name || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Factory className="h-4 w-4 text-gray-400" />
                        {product.partner?.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.productType === 'TYPE_A'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {product.productType === 'TYPE_A' ? 'Type A' : 'Type B'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.unitPrice ? `¥${product.unitPrice.toLocaleString()}` : '-'}
                      {product.unit && <span className="text-gray-500 text-xs"> /{product.unit}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {product.isActive ? '販売中' : '停止中'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`}>
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
