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
  deliveryAddress: string;
  desiredDate: string | null;
  orderedAt: string | null;
  member: { id: string; name: string; code: string };
  items: Array<{
    id: string;
    itemName: string;
    quantity: string;
    subtotal: string;
    status: string | null;
    partner: { id: string; name: string };
  }>;
}

export default function PartnerOrdersPage() {
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

  const getMyItemsTotal = (items: Order['items']) => {
    // パートナー用フィルターはAPI側で行われているため全アイテムを合計
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    return formatCurrency(total.toString());
  };

  const getMyItemsStatus = (items: Order['items']) => {
    const pending = items.filter(i => !i.status || i.status === 'pending').length;
    const shipped = items.filter(i => i.status === 'shipped').length;
    const delivered = items.filter(i => i.status === 'delivered').length;

    if (delivered === items.length) return { label: '全て納品完了', variant: 'default' as const };
    if (shipped > 0) return { label: `${shipped}/${items.length} 出荷済`, variant: 'outline' as const };
    if (pending === items.length) return { label: '出荷待ち', variant: 'destructive' as const };
    return { label: '処理中', variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">受注一覧</h1>
        <p className="text-muted-foreground">受注の管理・出荷処理</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              受注一覧
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="ordered">受注（出荷待ち）</SelectItem>
                <SelectItem value="shipped">出荷済み</SelectItem>
                <SelectItem value="delivered">納品完了</SelectItem>
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
              受注がありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>発注番号</TableHead>
                  <TableHead>加盟店</TableHead>
                  <TableHead>明細数</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>出荷状況</TableHead>
                  <TableHead>希望納期</TableHead>
                  <TableHead>受注日</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const itemStatus = getMyItemsStatus(order.items);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{order.member.name}</TableCell>
                      <TableCell>{order.items.length}件</TableCell>
                      <TableCell className="text-right">
                        {getMyItemsTotal(order.items)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={itemStatus.variant}>
                          {itemStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.desiredDate)}</TableCell>
                      <TableCell>{formatDate(order.orderedAt)}</TableCell>
                      <TableCell>
                        <Link href={`/partner/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
