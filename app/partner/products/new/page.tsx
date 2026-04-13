'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Category { id: string; name: string }

export default function NewPartnerProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [productType, setProductType] = useState('TYPE_A')
  const [categoryId, setCategoryId] = useState('')

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      categoryId,
      productType,
      unit: formData.get('unit') as string,
      unitPrice: productType === 'TYPE_A' ? parseFloat(formData.get('unitPrice') as string) : null,
      description: formData.get('description') as string,
      specifications: formData.get('specifications') as string || undefined,
    }

    try {
      const res = await fetch('/api/partner/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '登録に失敗しました')
      }
      router.push('/partner/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally { setIsLoading(false) }
  }

  return (
    <div className="max-w-lg">
      <Link href="/partner/products">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          商品一覧に戻る
        </Button>
      </Link>

      <h1 className="text-2xl font-bold mb-2">新規商品登録</h1>
      <p className="text-sm text-gray-500 mb-6">登録後、セリビオ管理者の承認を経てカタログに掲載されます</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="code">商品��ード *</Label>
          <Input id="code" name="code" placeholder="PROD-001" required disabled={isLoading} className="min-h-12" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">商品名 *</Label>
          <Input id="name" name="name" placeholder="ソーラ���パネル 400W" required disabled={isLoading} className="min-h-12" />
        </div>

        <div className="space-y-2">
          <Label>カテゴリ *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="min-h-12"><SelectValue placeholder="カテゴリを選択" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>商品タイプ *</Label>
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger className="min-h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TYPE_A">Type A（即発注 / 価格確定）</SelectItem>
              <SelectItem value="TYPE_B">Type B（見積必要 / 仕様調整あり）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit">単位</Label>
            <Input id="unit" name="unit" placeholder="枚、kW、式" disabled={isLoading} className="min-h-12" />
          </div>
          {productType === 'TYPE_A' && (
            <div className="space-y-2">
              <Label htmlFor="unitPrice">単価（円） *</Label>
              <Input id="unitPrice" name="unitPrice" type="number" placeholder="50000" required disabled={isLoading} className="min-h-12" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Textarea id="description" name="description" placeholder="商品の説明" rows={3} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specifications">仕様詳細（JSON）</Label>
          <Textarea id="specifications" name="specifications" placeholder='{"出力": "400W", "サイズ": "1722x1134mm"}' rows={3} disabled={isLoading} />
        </div>

        <Button type="submit" className="w-full min-h-12" disabled={isLoading || !categoryId}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />登録中...</> : '商品を登録'}
        </Button>
      </form>
    </div>
  )
}
