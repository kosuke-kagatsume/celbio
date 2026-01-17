'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  code: string;
  name: string;
  flowType: string;
}

interface Partner {
  id: string;
  code: string;
  name: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  partnerId: string;
  unit: string | null;
}

interface QuoteItem {
  partnerId: string;
  productId: string | null;
  itemName: string;
  specification: string;
  quantity: number | null;
  unit: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([
    { partnerId: '', productId: null, itemName: '', specification: '', quantity: null, unit: '' },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, partnersRes, productsRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/partners'),
        fetch('/api/admin/products'),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }
      if (partnersRes.ok) {
        const data = await partnersRes.json();
        setPartners(data);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { partnerId: '', productId: null, itemName: '', specification: '', quantity: null, unit: '' },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number | null) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // 商品選択時に自動入力
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].itemName = product.name;
        newItems[index].unit = product.unit || '';
        newItems[index].partnerId = product.partnerId;
      }
    }

    setItems(newItems);
  };

  const getPartnerProducts = (partnerId: string) => {
    return products.filter(p => p.partnerId === partnerId);
  };

  const handleSubmit = async (isDraft: boolean) => {
    // バリデーション
    if (!categoryId || !title) {
      alert('カテゴリとタイトルは必須です');
      return;
    }

    const validItems = items.filter(item => item.partnerId && item.itemName);
    if (validItems.length === 0) {
      alert('少なくとも1つの明細を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          title,
          description,
          deliveryAddress,
          desiredDate: desiredDate || null,
          items: validItems,
        }),
      });

      if (response.ok) {
        const quote = await response.json();

        if (!isDraft) {
          // 下書きでない場合は提出
          await fetch(`/api/quotes/${quote.id}/submit`, { method: 'POST' });
        }

        router.push('/member/quotes');
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/member/quotes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">新規見積依頼</h1>
          <p className="text-muted-foreground">見積依頼を作成します</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: ○○邸 太陽光設備"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">依頼内容詳細</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="見積依頼の詳細を入力してください"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">納品先住所</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="例: 東京都○○区..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desiredDate">希望納期</Label>
                <Input
                  id="desiredDate"
                  type="date"
                  value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 明細 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>見積明細</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                明細追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">明細 {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>メーカー *</Label>
                    <Select
                      value={item.partnerId}
                      onValueChange={(v) => updateItem(index, 'partnerId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="メーカーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>商品（任意）</Label>
                    <Select
                      value={item.productId || ''}
                      onValueChange={(v) => updateItem(index, 'productId', v || null)}
                      disabled={!item.partnerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="商品を選択（任意）" />
                      </SelectTrigger>
                      <SelectContent>
                        {getPartnerProducts(item.partnerId).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>品名 *</Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      placeholder="品名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>数量</Label>
                    <Input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="数量"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>単位</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="例: 枚, セット"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>仕様・備考</Label>
                  <Textarea
                    value={item.specification}
                    onChange={(e) => updateItem(index, 'specification', e.target.value)}
                    placeholder="仕様の詳細や備考"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* アクション */}
        <div className="flex justify-end gap-4">
          <Link href="/member/quotes">
            <Button variant="outline">キャンセル</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            下書き保存
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            見積依頼を送信
          </Button>
        </div>
      </div>
    </div>
  );
}
