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
import { Plus, Building2, Users, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function MembersPage() {
  // データベースから加盟店一覧を取得
  const members = await prisma.member.findMany({
    include: {
      users: true,
      _count: {
        select: {
          quotes: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">加盟店管理</h1>
          <p className="text-gray-500 mt-1">リラシオネス加盟店の管理</p>
        </div>
        <Link href="/admin/members/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            新規加盟店登録
          </Button>
        </Link>
      </div>

      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総加盟店数</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}社</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter((m) => m.isActive).length}社
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.reduce((acc, m) => acc + m.users.length, 0)}名
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 一覧テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>加盟店一覧</CardTitle>
          <CardDescription>登録されている加盟店の一覧</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>加盟店が登録されていません</p>
              <Link href="/admin/members/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  最初の加盟店を登録
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>加盟店名</TableHead>
                  <TableHead>コード</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>ユーザー数</TableHead>
                  <TableHead>取引数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.code}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{member.email}</p>
                        <p className="text-gray-500">{member.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.users.length}名</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>見積: {member._count.quotes}件</p>
                        <p>発注: {member._count.orders}件</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          member.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {member.isActive ? 'アクティブ' : '停止中'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/members/${member.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/members/${member.id}/edit`}>
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
