'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

interface QuoteItem {
  id: string;
  itemName: string;
  specification: string | null;
  quantity: string | null;
  unit: string | null;
  unitPrice: string | null;
  subtotal: string | null;
  status: string | null;
  partner: { id: string; name: string };
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string | null;
  description: string | null;
  status: string;
  deliveryAddress: string | null;
  desiredDate: string | null;
  createdAt: string;
  member: { id: string; name: string; code: string; address: string | null };
  user: { id: string; name: string; email: string };
  category: { id: string; name: string };
  items: QuoteItem[];
  files: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string | null;
  }>;
}

interface ItemInput {
  id: string;
  unitPrice: string;
  specification: string;
}

export default function PartnerQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemInputs, setItemInputs] = useState<ItemInput[]>([]);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
        // 自社の明細の入力状態を初期化
        const myItems = data.items.map((item: QuoteItem) => ({
          id: item.id,
          unitPrice: item.unitPrice || '',
          specification: item.specification || '',
        }));
        setItemInputs(myItems);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemInput = (itemId: string, field: 'unitPrice' | 'specification', value: string) => {
    setItemInputs(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    // バリデーション
    const myItems = itemInputs.filter(item => {
      const quoteItem = quote?.items.find(qi => qi.id === item.id);
      return quoteItem && quoteItem.status !== 'quoted';
    });

    const hasEmptyPrice = myItems.some(item => !item.unitPrice);
    if (hasEmptyPrice) {
      alert('全ての明細に単価を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemInputs.map(item => ({
            id: item.id,
            unitPrice: parseFloat(item.unitPrice),
            specification: item.specification,
          })),
        }),
      });

      if (response.ok) {
        alert('見積回答を送信しました');
        fetchQuote();
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error responding to quote:', error);
      alert('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
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

  const calculateSubtotal = (itemId: string) => {
    const input = itemInputs.find(i => i.id === itemId);
    const quoteItem = quote?.items.find(i => i.id === itemId);
    if (!input?.unitPrice || !quoteItem?.quantity) return '-';
    const subtotal = parseFloat(input.unitPrice) * parseFloat(quoteItem.quantity);
    return formatCurrency(subtotal.toString());
  };

  const canRespond = quote?.status === 'requested';
  const hasUnquotedItems = quote?.items.some(item => item.status !== 'quoted');

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
        <Link href="/partner/quotes">
          <Button variant="link">一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/partner/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
              <Badge variant={quote.status === 'requested' ? 'destructive' : 'default'}>
                {quote.status === 'requested' ? '回答待ち' : '回答済み'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{quote.title}</p>
          </div>
        </div>

        {canRespond && hasUnquotedItems && (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            見積回答を送信
          </Button>
        )}
      </div>

      {/* 依頼元情報 */}
      <Card>
        <CardHeader>
          <CardTitle>依頼元情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">加盟店</dt>
              <dd className="font-medium">{quote.member.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">担当者</dt>
              <dd className="font-medium">{quote.user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">カテゴリ</dt>
              <dd className="font-medium">{quote.category.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">希望納期</dt>
              <dd className="font-medium">{formatDate(quote.desiredDate)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-muted-foreground">納品先</dt>
              <dd className="font-medium">{quote.deliveryAddress || '-'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-muted-foreground">依頼日</dt>
              <dd className="font-medium">{formatDate(quote.createdAt)}</dd>
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

      {/* 見積明細・回答入力 */}
      <Card>
        <CardHeader>
          <CardTitle>見積明細</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quote.items.map((item) => {
            const input = itemInputs.find(i => i.id === item.id);
            const isQuoted = item.status === 'quoted';

            return (
              <div
                key={item.id}
                className={`p-4 border rounded-lg ${isQuoted ? 'bg-muted/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">{item.itemName}</h4>
                    <p className="text-sm text-muted-foreground">
                      数量: {item.quantity || '-'} {item.unit || ''}
                    </p>
                  </div>
                  <Badge variant={isQuoted ? 'default' : 'secondary'}>
                    {isQuoted ? '回答済み' : '未回答'}
                  </Badge>
                </div>

                {isQuoted ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">仕様</span>
                      <p>{item.specification || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">単価</span>
                      <p>{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">小計</span>
                      <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-medium">仕様・備考</label>
                      <Textarea
                        value={input?.specification || ''}
                        onChange={(e) => updateItemInput(item.id, 'specification', e.target.value)}
                        placeholder="仕様の詳細や備考"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">単価 *</label>
                      <Input
                        type="number"
                        value={input?.unitPrice || ''}
                        onChange={(e) => updateItemInput(item.id, 'unitPrice', e.target.value)}
                        placeholder="単価を入力"
                      />
                      <p className="text-sm text-muted-foreground">
                        小計: {calculateSubtotal(item.id)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
