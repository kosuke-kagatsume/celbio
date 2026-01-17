'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewPartnerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      postalCode: formData.get('postalCode') as string,
      address: formData.get('address') as string,
      bankName: formData.get('bankName') as string,
      bankBranch: formData.get('bankBranch') as string,
      bankAccountType: formData.get('bankAccountType') as string,
      bankAccountNumber: formData.get('bankAccountNumber') as string,
      bankAccountName: formData.get('bankAccountName') as string,
      notes: formData.get('notes') as string,
    };

    try {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '登録に失敗しました');
      }

      router.push('/admin/partners');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/partners">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          メーカー一覧に戻る
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>新規メーカー登録</CardTitle>
          <CardDescription>新しいメーカー・パートナーを登録します</CardDescription>
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
                <Label htmlFor="code">メーカーコード *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="P001"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">メーカー名 *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="株式会社サンプルメーカー"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="info@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="03-1234-5678"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">郵便番号</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="123-4567"
                  disabled={isLoading}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="東京都渋谷区..."
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 振込先情報 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">振込先情報（メーカー支払い用）</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">銀行名</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    placeholder="○○銀行"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankBranch">支店名</Label>
                  <Input
                    id="bankBranch"
                    name="bankBranch"
                    placeholder="○○支店"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountType">口座種別</Label>
                  <Input
                    id="bankAccountType"
                    name="bankAccountType"
                    placeholder="普通"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">口座番号</Label>
                  <Input
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    placeholder="1234567"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName">口座名義</Label>
                  <Input
                    id="bankAccountName"
                    name="bankAccountName"
                    placeholder="カ）サンプルメーカー"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="特記事項があれば入力"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/partners">
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
