'use client';

import { useEffect, useState, use } from 'react';
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
import { ArrowLeft, Loader2, Package, Truck, CheckCircle2 } from 'lucide-react';

interface OrderItem {
  id: string;
  itemName: string;
  specification: string | null;
  quantity: string;
  unit: string | null;
  unitPrice: string;
  subtotal: string;
  status: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  partner: { id: string; name: string; code: string };
  product: { id: string; name: string; code: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  deliveryAddress: string;
  desiredDate: string | null;
  note: string | null;
  orderedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  member: { id: string; name: string; code: string; address: string | null; phone: string | null };
  user: { id: string; name: string; email: string };
  quote: {
    id: string;
    quoteNumber: string;
    title: string;
    category: { id: string; name: string };
  } | null;
  items: OrderItem[];
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    status: string;
  }>;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ordered: { label: '発注済み', variant: 'default' },
  confirmed: { label: '確定', variant: 'default' },
  shipped: { label: '出荷済み', variant: 'outline' },
  delivered: { label: '納品完了', variant: 'default' },
  invoiced: { label: '請求済み', variant: 'outline' },
  completed: { label: '完了', variant: 'secondary' },
};

const itemStatusLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  pending: { label: '準備中', icon: <Package className="h-4 w-4" /> },
  confirmed: { label: '確定', icon: <Package className="h-4 w-4" /> },
  shipped: { label: '出荷済み', icon: <Truck className="h-4 w-4" /> },
  delivered: { label: '納品完了', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">発注が見つかりません</p>
        <Link href="/member/orders">
          <Button variant="link">一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/member/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <Badge variant={statusLabels[order.status]?.variant || 'secondary'}>
              {statusLabels[order.status]?.label || order.status}
            </Badge>
          </div>
          {order.quote && (
            <p className="text-muted-foreground">
              見積: {order.quote.quoteNumber} - {order.quote.title}
            </p>
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>発注情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">発注者</dt>
              <dd className="font-medium">{order.user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">発注日</dt>
              <dd className="font-medium">{formatDateTime(order.orderedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">希望納期</dt>
              <dd className="font-medium">{formatDate(order.desiredDate)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">合計金額</dt>
              <dd className="font-medium text-lg">{formatCurrency(order.totalAmount)}</dd>
            </div>
            <div className="col-span-2 md:col-span-4">
              <dt className="text-sm text-muted-foreground">納品先</dt>
              <dd className="font-medium">{order.deliveryAddress}</dd>
            </div>
            {order.note && (
              <div className="col-span-2 md:col-span-4">
                <dt className="text-sm text-muted-foreground">備考</dt>
                <dd className="whitespace-pre-wrap">{order.note}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 発注明細 */}
      <Card>
        <CardHeader>
          <CardTitle>発注明細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メーカー</TableHead>
                <TableHead>品名</TableHead>
                <TableHead>仕様</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead>単位</TableHead>
                <TableHead className="text-right">単価</TableHead>
                <TableHead className="text-right">小計</TableHead>
                <TableHead>状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.partner.name}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.specification || '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>{item.unit || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {itemStatusLabels[item.status || 'pending']?.icon}
                      <span className="text-sm">
                        {itemStatusLabels[item.status || 'pending']?.label}
                      </span>
                    </div>
                    {item.shippedAt && (
                      <p className="text-xs text-muted-foreground">
                        出荷: {formatDate(item.shippedAt)}
                      </p>
                    )}
                    {item.deliveredAt && (
                      <p className="text-xs text-muted-foreground">
                        納品: {formatDate(item.deliveredAt)}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 請求書情報 */}
      {order.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>請求書</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>請求書番号</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/member/invoices/${invoice.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                        {invoice.status === 'paid' ? '支払済み' : '未払い'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
