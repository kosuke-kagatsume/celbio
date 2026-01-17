'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, TrendingUp, Banknote, Eye, Loader2 } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string | null;
  orderedAt: string | null;
  createdAt: string;
  member: { id: string; name: string; code: string };
  quote: { id: string; quoteNumber: string; title: string | null } | null;
  items: Array<{ partner: { id: string; name: string } }>;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ordered: { label: '発注済み', variant: 'default' },
  confirmed: { label: '確定', variant: 'default' },
  shipped: { label: '出荷済み', variant: 'outline' },
  delivered: { label: '納品完了', variant: 'outline' },
  invoiced: { label: '請求済み', variant: 'secondary' },
  paid: { label: '支払済み', variant: 'default' },
  completed: { label: '完了', variant: 'default' },
};

const progressSteps = ['ordered', 'confirmed', 'shipped', 'delivered', 'invoiced', 'paid', 'completed'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, monthlyAmount: 0 });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);

        // 統計情報を計算（フィルターがallで最初のページの場合のみ）
        if (statusFilter === 'all' && page === 1) {
          // 全件取得して統計計算
          const allRes = await fetch('/api/orders?limit=1000');
          const allData = await allRes.json();
          const allOrders = allData.orders as Order[];

          // 今月の発注額を計算
          const now = new Date();
          const thisMonth = now.getMonth();
          const thisYear = now.getFullYear();
          let monthlyAmount = 0;
          let inProgress = 0;

          allOrders.forEach((order) => {
            // 進行中（完了以外）のカウント
            if (order.status !== 'completed') {
              inProgress++;
            }

            // 今月の発注額
            const orderDate = order.orderedAt ? new Date(order.orderedAt) : new Date(order.createdAt);
            if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
              const amount = typeof order.totalAmount === 'string'
                ? parseFloat(order.totalAmount)
                : (order.totalAmount || 0);
              monthlyAmount += amount;
            }
          });

          setStats({
            total: allData.pagination.total,
            inProgress,
            monthlyAmount,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: number | string | null) => {
    if (amount === null || amount === undefined) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(numAmount);
  };

  const getPartnerNames = (items: Order['items']) => {
    const names = [...new Set(items.map(item => item.partner.name))];
    return names.length > 0 ? names.join(', ') : '-';
  };

  const getProgress = (status: string) => {
    const currentIndex = progressSteps.indexOf(status);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / progressSteps.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">発注管理</h1>
        <p className="text-muted-foreground">全加盟店の発注を一覧・管理</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総発注数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}件</div>
            <p className="text-xs text-muted-foreground">完了以外の発注</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月発注額</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyAmount)}</div>
            <p className="text-xs text-muted-foreground">今月の発注総額</p>
          </CardContent>
        </Card>
      </div>

      {/* 発注一覧 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              発注一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="ordered">発注済み</SelectItem>
                <SelectItem value="confirmed">確定</SelectItem>
                <SelectItem value="shipped">出荷済み</SelectItem>
                <SelectItem value="delivered">納品完了</SelectItem>
                <SelectItem value="invoiced">請求済み</SelectItem>
                <SelectItem value="paid">支払済み</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              発注がありません
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>発注番号</TableHead>
                    <TableHead>加盟店</TableHead>
                    <TableHead>見積番号</TableHead>
                    <TableHead>メーカー</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>進捗</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>発注日</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.member.name}</div>
                          <div className="text-sm text-muted-foreground">{order.member.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.quote ? (
                          <Link href={`/admin/quotes/${order.quote.id}`} className="text-blue-600 hover:underline">
                            {order.quote.quoteNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {getPartnerNames(order.items)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[order.status]?.variant || 'secondary'}>
                          {statusLabels[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${getProgress(order.status)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{getProgress(order.status)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>{formatDate(order.orderedAt || order.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    前へ
                  </Button>
                  <span className="flex items-center px-4">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    次へ
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
