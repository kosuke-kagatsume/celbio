'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Truck, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  partner: { id: string; name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  deliveryAddress: string;
  desiredDate: string | null;
  note: string | null;
  orderedAt: string | null;
  member: { id: string; name: string; code: string; address: string | null; phone: string | null };
  user: { id: string; name: string; email: string };
  items: OrderItem[];
}

export default function PartnerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

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

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    setUpdatingItemId(itemId);
    try {
      const response = await fetch(`/api/orders/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrder();
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('エラーが発生しました');
    } finally {
      setUpdatingItemId(null);
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
        <Link href="/partner/orders">
          <Button variant="link">一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  const totalAmount = order.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/partner/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            {order.member.name} からの受注
          </p>
        </div>
      </div>

      {/* 発注元情報 */}
      <Card>
        <CardHeader>
          <CardTitle>発注元情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">加盟店</dt>
              <dd className="font-medium">{order.member.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">担当者</dt>
              <dd className="font-medium">{order.user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">受注日</dt>
              <dd className="font-medium">{formatDateTime(order.orderedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">希望納期</dt>
              <dd className="font-medium">{formatDate(order.desiredDate)}</dd>
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

      {/* 受注明細・出荷処理 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>受注明細</CardTitle>
            <div className="text-lg font-bold">
              合計: {formatCurrency(totalAmount.toString())}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => {
            const isPending = !item.status || item.status === 'pending';
            const isShipped = item.status === 'shipped';
            const isDelivered = item.status === 'delivered';
            const isUpdating = updatingItemId === item.id;

            return (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-lg">{item.itemName}</h4>
                    {item.specification && (
                      <p className="text-sm text-muted-foreground">{item.specification}</p>
                    )}
                    <p className="text-sm mt-1">
                      {item.quantity} {item.unit || ''} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      isDelivered ? 'default' : isShipped ? 'outline' : 'secondary'
                    }
                  >
                    {isDelivered ? '納品完了' : isShipped ? '出荷済み' : '出荷待ち'}
                  </Badge>
                </div>

                {/* ステータス履歴 */}
                {(item.shippedAt || item.deliveredAt) && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    {item.shippedAt && <p>出荷日: {formatDateTime(item.shippedAt)}</p>}
                    {item.deliveredAt && <p>納品日: {formatDateTime(item.deliveredAt)}</p>}
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex gap-2">
                  {isPending && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default" disabled={isUpdating}>
                          {isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Truck className="mr-2 h-4 w-4" />
                          )}
                          出荷処理
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>出荷処理の確認</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{item.itemName}」を出荷済みにしますか？
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => updateItemStatus(item.id, 'shipped')}
                          >
                            出荷済みにする
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {isShipped && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default" disabled={isUpdating}>
                          {isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          納品完了
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>納品完了の確認</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{item.itemName}」を納品完了にしますか？
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => updateItemStatus(item.id, 'delivered')}
                          >
                            納品完了にする
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {isDelivered && (
                    <p className="text-green-600 flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      納品完了
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
