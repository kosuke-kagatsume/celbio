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
import { ShoppingCart, Eye, Loader2 } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  deliveryAddress: string;
  desiredDate: string | null;
  orderedAt: string | null;
  createdAt: string;
  quote: { id: string; quoteNumber: string; title: string } | null;
  items: Array<{
    id: string;
    itemName: string;
    status: string | null;
    partner: { id: string; name: string };
  }>;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '下書き', variant: 'secondary' },
  ordered: { label: '発注済み', variant: 'default' },
  confirmed: { label: '確定', variant: 'default' },
  shipped: { label: '出荷済み', variant: 'outline' },
  delivered: { label: '納品完了', variant: 'default' },
  invoiced: { label: '請求済み', variant: 'outline' },
  paid: { label: '支払済み', variant: 'default' },
  completed: { label: '完了', variant: 'secondary' },
};

export default function MemberOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
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

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(parseFloat(amount));
  };

  const getPartnerNames = (items: Order['items']) => {
    const names = [...new Set(items.map(item => item.partner.name))];
    return names.join(', ');
  };

  const getDeliveryProgress = (items: Order['items']) => {
    const delivered = items.filter(i => i.status === 'delivered').length;
    const shipped = items.filter(i => i.status === 'shipped').length;
    return `${delivered}/${items.length} 納品 (${shipped} 出荷済)`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">発注一覧</h1>
        <p className="text-muted-foreground">発注の管理・追跡</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              発注一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="ordered">発注済み</SelectItem>
                <SelectItem value="shipped">出荷済み</SelectItem>
                <SelectItem value="delivered">納品完了</SelectItem>
                <SelectItem value="invoiced">請求済み</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>発注番号</TableHead>
                  <TableHead>見積番号</TableHead>
                  <TableHead>メーカー</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>進捗</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>希望納期</TableHead>
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
                      {order.quote ? (
                        <Link
                          href={`/member/quotes/${order.quote.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {order.quote.quoteNumber}
                        </Link>
                      ) : (
                        '-'
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
                    <TableCell className="text-sm text-muted-foreground">
                      {getDeliveryProgress(order.items)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>{formatDate(order.desiredDate)}</TableCell>
                    <TableCell>{formatDate(order.orderedAt)}</TableCell>
                    <TableCell>
                      <Link href={`/member/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
