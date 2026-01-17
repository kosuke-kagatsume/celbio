'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string | null;
  description: string | null;
  status: string;
  totalAmount: string | null;
  deliveryAddress: string | null;
  desiredDate: string | null;
  createdAt: string;
  approvedAt: string | null;
  member: { id: string; name: string; address: string | null; phone: string | null };
  user: { id: string; name: string; email: string };
  category: { id: string; name: string; flowType: string };
  items: Array<{
    id: string;
    itemName: string;
    specification: string | null;
    quantity: string | null;
    unit: string | null;
    unitPrice: string | null;
    subtotal: string | null;
    status: string | null;
    partner: { id: string; name: string };
    product: { id: string; name: string } | null;
  }>;
  files: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string | null;
  }>;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '下書き', variant: 'secondary' },
  requested: { label: '依頼中', variant: 'default' },
  responded: { label: '回答済み', variant: 'outline' },
  approved: { label: '承認済み', variant: 'default' },
  rejected: { label: '却下', variant: 'destructive' },
};

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${id}/submit`, { method: 'POST' });
      if (response.ok) {
        fetchQuote();
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/quotes/${id}/approve`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        alert(`見積を承認しました。発注番号: ${data.order.orderNumber}`);
        router.push('/member/orders');
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error approving quote:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '-';
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

  if (!quote) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">見積が見つかりません</p>
        <Link href="/member/quotes">
          <Button variant="link">一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/member/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
              <Badge variant={statusLabels[quote.status]?.variant || 'secondary'}>
                {statusLabels[quote.status]?.label || quote.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{quote.title}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              見積依頼を送信
            </Button>
          )}
          {quote.status === 'responded' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isApproving}>
                  {isApproving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  見積を承認・発注
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>見積の承認</AlertDialogTitle>
                  <AlertDialogDescription>
                    この見積を承認し、発注を作成しますか？
                    <br />
                    合計金額: {formatCurrency(quote.totalAmount)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApprove}>
                    承認して発注
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">カテゴリ</dt>
              <dd className="font-medium">{quote.category.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">依頼者</dt>
              <dd className="font-medium">{quote.user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">希望納期</dt>
              <dd className="font-medium">{formatDate(quote.desiredDate)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">作成日</dt>
              <dd className="font-medium">{formatDate(quote.createdAt)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-muted-foreground">納品先</dt>
              <dd className="font-medium">{quote.deliveryAddress || '-'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-muted-foreground">合計金額</dt>
              <dd className="font-medium text-lg">{formatCurrency(quote.totalAmount)}</dd>
            </div>
          </dl>
          {quote.description && (
            <div className="mt-4 pt-4 border-t">
              <dt className="text-sm text-muted-foreground mb-1">依頼内容詳細</dt>
              <dd className="whitespace-pre-wrap">{quote.description}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 明細 */}
      <Card>
        <CardHeader>
          <CardTitle>見積明細</CardTitle>
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
              {quote.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.partner.name}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.specification || '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity || '-'}</TableCell>
                  <TableCell>{item.unit || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'quoted' ? 'default' : 'secondary'}>
                      {item.status === 'quoted' ? '回答済み' : '回答待ち'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 添付ファイル */}
      {quote.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>添付ファイル</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {quote.files.map((file) => (
                <li key={file.id}>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {file.fileName}
                  </a>
                  {file.fileType && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({file.fileType})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
