'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Building2, Receipt } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    deliveryAddress: string;
    orderedAt: string | null;
    items: Array<{
      id: string;
      itemName: string;
      specification: string | null;
      quantity: string;
      unit: string | null;
      unitPrice: string;
      subtotal: string;
      partner: { id: string; name: string };
    }>;
  };
  partner: {
    id: string;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    bankName: string | null;
    bankBranch: string | null;
    bankAccountType: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
  };
  member: {
    id: string;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
  };
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  issued: { label: '未払い', variant: 'destructive' },
  sent: { label: '未払い', variant: 'destructive' },
  paid: { label: '支払済み', variant: 'default' },
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">請求書が見つかりません</p>
        <Link href="/member/invoices">
          <Button variant="link">一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  const isOverdue =
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date() &&
    invoice.status !== 'paid';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/member/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <Badge variant={statusLabels[invoice.status]?.variant || 'secondary'}>
              {statusLabels[invoice.status]?.label || invoice.status}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">支払期限超過</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            発注: {invoice.order.orderNumber}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 請求元情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              請求元
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">会社名</dt>
                <dd className="font-medium">{invoice.partner.name}</dd>
              </div>
              {invoice.partner.address && (
                <div>
                  <dt className="text-sm text-muted-foreground">住所</dt>
                  <dd>{invoice.partner.address}</dd>
                </div>
              )}
              {invoice.partner.phone && (
                <div>
                  <dt className="text-sm text-muted-foreground">電話</dt>
                  <dd>{invoice.partner.phone}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* 振込先情報 */}
        <Card>
          <CardHeader>
            <CardTitle>振込先</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.partner.bankName ? (
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">銀行名</dt>
                  <dd className="font-medium">{invoice.partner.bankName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">支店名</dt>
                  <dd>{invoice.partner.bankBranch}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">口座種別</dt>
                  <dd>{invoice.partner.bankAccountType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">口座番号</dt>
                  <dd>{invoice.partner.bankAccountNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">口座名義</dt>
                  <dd>{invoice.partner.bankAccountName}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">振込先情報が登録されていません</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 請求情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            請求内容
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">発行日</dt>
              <dd className="font-medium">{formatDate(invoice.issuedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">支払期限</dt>
              <dd className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {formatDate(invoice.dueDate)}
              </dd>
            </div>
            {invoice.paidAt && (
              <div>
                <dt className="text-sm text-muted-foreground">支払日</dt>
                <dd className="font-medium">{formatDate(invoice.paidAt)}</dd>
              </div>
            )}
          </div>

          {/* 明細 */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">品名</th>
                  <th className="text-left p-3">仕様</th>
                  <th className="text-right p-3">数量</th>
                  <th className="text-right p-3">単価</th>
                  <th className="text-right p-3">小計</th>
                </tr>
              </thead>
              <tbody>
                {invoice.order.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 font-medium">{item.itemName}</td>
                    <td className="p-3 text-muted-foreground">
                      {item.specification || '-'}
                    </td>
                    <td className="p-3 text-right">
                      {item.quantity} {item.unit || ''}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 合計 */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>{formatCurrency(invoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>消費税（10%）</span>
                  <span>{formatCurrency(invoice.taxAmount || '0')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>合計</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
