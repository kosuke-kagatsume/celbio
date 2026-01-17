'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Receipt } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  deliveryAddress: string;
  orderedAt: string | null;
  member: { id: string; name: string };
  items: Array<{
    id: string;
    itemName: string;
    quantity: string;
    unitPrice: string;
    subtotal: string;
    partner: { id: string; name: string };
  }>;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // 納品完了かつ未請求の発注を取得
      const response = await fetch('/api/orders?status=delivered');
      if (response.ok) {
        const data = await response.json();
        // 請求書未発行のものだけフィルター
        const uninvoicedOrders = data.orders.filter(
          (order: Order) => order.status === 'delivered'
        );
        setOrders(uninvoicedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const calculateTotal = () => {
    if (!selectedOrder) return { amount: 0, tax: 0, total: 0 };
    const amount = selectedOrder.items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0
    );
    const tax = Math.floor(amount * 0.1);
    return { amount, tax, total: amount + tax };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const handleSubmit = async () => {
    if (!selectedOrderId) {
      alert('発注を選択してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          dueDate: dueDate || null,
        }),
      });

      if (response.ok) {
        const invoice = await response.json();
        alert(`請求書を発行しました: ${invoice.invoiceNumber}`);
        router.push('/partner/invoices');
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/partner/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">請求書発行</h1>
          <p className="text-muted-foreground">納品完了した発注に対して請求書を発行</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            請求可能な発注がありません
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* 発注選択 */}
          <Card>
            <CardHeader>
              <CardTitle>発注を選択</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOrderId === order.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.member.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        発注日: {formatDate(order.orderedAt)}
                      </p>
                    </div>
                    <Badge variant="default">納品完了</Badge>
                  </div>
                  <div className="mt-2 text-sm">
                    {order.items.length}件の明細 /
                    {formatCurrency(
                      order.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 請求内容プレビュー */}
          {selectedOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  請求内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">請求先</p>
                    <p className="font-medium">{selectedOrder.member.name}</p>
                  </div>
                  <div>
                    <Label htmlFor="dueDate">支払期限</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* 明細 */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">品名</th>
                        <th className="text-right p-2">数量</th>
                        <th className="text-right p-2">単価</th>
                        <th className="text-right p-2">小計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.itemName}</td>
                          <td className="text-right p-2">{item.quantity}</td>
                          <td className="text-right p-2">
                            {formatCurrency(parseFloat(item.unitPrice))}
                          </td>
                          <td className="text-right p-2">
                            {formatCurrency(parseFloat(item.subtotal))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 合計 */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>小計</span>
                    <span>{formatCurrency(totals.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>消費税（10%）</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>合計</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* アクション */}
          <div className="flex justify-end gap-4">
            <Link href="/partner/invoices">
              <Button variant="outline">キャンセル</Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={!selectedOrderId || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              請求書を発行
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
