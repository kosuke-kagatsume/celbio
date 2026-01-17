'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    // カテゴリとメーカーを取得
    Promise.all([
      fetch('/api/admin/categories').then((res) => res.json()),
      fetch('/api/admin/partners').then((res) => res.json()),
    ]).then(([cats, parts]) => {
      setCategories(cats);
      setPartners(parts);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      categoryId: formData.get('categoryId') as string,
      partnerId: formData.get('partnerId') as string,
      productType: formData.get('productType') as string,
      unit: formData.get('unit') as string,
      unitPrice: formData.get('unitPrice') ? Number(formData.get('unitPrice')) : null,
      description: formData.get('description') as string,
      specifications: formData.get('specifications') as string,
    };

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '登録に失敗しました');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/products">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          商材一覧に戻る
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>新規商材登録</CardTitle>
          <CardDescription>新しい商材を登録します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">商材コード *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="PROD001"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">商材名 *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="太陽光パネル 400W"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">カテゴリ *</Label>
                <Select name="categoryId" required disabled={isLoading}>
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
                <Label htmlFor="partnerId">メーカー *</Label>
                <Select name="partnerId" required disabled={isLoading}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="productType">商材タイプ *</Label>
              <Select name="productType" required disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="タイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TYPE_A">
                    Type A（定額商材 - 即時発注可能）
                  </SelectItem>
                  <SelectItem value="TYPE_B">
                    Type B（見積商材 - 都度見積が必要）
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Type A: 価格が固定で即時発注可能な商材
                <br />
                Type B: 仕様・条件により価格が変動する商材（見積回答が必要）
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">単位</Label>
                <Input
                  id="unit"
                  name="unit"
                  placeholder="枚、kW、㎡など"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">単価（Type Aの場合）</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  placeholder="50000"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">商品説明</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="商品の説明を入力"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specifications">仕様</Label>
              <Textarea
                id="specifications"
                name="specifications"
                placeholder="仕様詳細をJSON形式または自由記述で入力"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/products">
                <Button type="button" variant="outline" disabled={isLoading}>
                  キャンセル
                </Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登録中...
                  </>
                ) : (
                  '登録'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
