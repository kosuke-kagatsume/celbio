'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Category { id: string; name: string; code: string }

interface Product {
  id: string; code: string; name: string; unit: string | null; unitPrice: string | null
  productType: string; isActive: boolean; description: string | null; specifications: Record<string, string> | null
  category: Category
}

export default function EditPartnerProductPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フォーム状態
  const [name, setName] = useState('')
  const [productType, setProductType] = useState('TYPE_A')
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [description, setDescription] = useState('')
  const [specifications, setSpecifications] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/partner/products/${id}`).then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()),
    ]).then(([prod, cats]) => {
      setProduct(prod)
      setCategories(Array.isArray(cats) ? cats : [])
      setName(prod.name || '')
      setProductType(prod.productType || 'TYPE_A')
      setCategoryId(prod.category?.id || '')
      setUnit(prod.unit || '')
      setUnitPrice(prod.unitPrice ? String(Number(prod.unitPrice)) : '')
      setDescription(prod.description || '')
      setSpecifications(prod.specifications ? JSON.stringify(prod.specifications, null, 2) : '')
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/partner/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, productType, unit, description,
          unitPrice: productType === 'TYPE_A' ? parseFloat(unitPrice) : null,
          specifications: specifications || undefined,
        }),
      })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '更新に失敗しました')
      }
      router.push('/partner/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally { setIsSaving(false) }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!product) {
    return <p className="text-center text-gray-400 py-8">商品が見つかりません</p>
  }

  return (
    <div className="max-w-lg">
      <Link href="/partner/products">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          商品一覧に戻る
        </Button>
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">商品編集</h1>
        <Badge variant={product.isActive ? 'default' : 'outline'} className={product.isActive ? 'bg-green-600' : 'text-yellow-600 border-yellow-300'}>
          {product.isActive ? '承認済み' : '承認待ち'}
        </Badge>
      </div>
      <p className="text-sm text-gray-500 mb-6">コード: {product.code}（変更不可）</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <div className="space-y-2">
          <Label>商品名 *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving} className="min-h-12" />
        </div>

        <div className="space-y-2">
          <Label>カテゴリ</Label>
          <Select value={categoryId} disabled>
            <SelectTrigger className="min-h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">カテゴリ変更は管理者にお問い合わせください</p>
        </div>

        <div className="space-y-2">
          <Label>商品タイプ</Label>
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
            <Label>単位</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="枚、kW、式" disabled={isSaving} className="min-h-12" />
          </div>
          {productType === 'TYPE_A' && (
            <div className="space-y-2">
              <Label>単価（円） *</Label>
              <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required disabled={isSaving} className="min-h-12" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>説明</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSaving} />
        </div>

        <div className="space-y-2">
          <Label>仕様詳細（JSON）</Label>
          <Textarea value={specifications} onChange={(e) => setSpecifications(e.target.value)} rows={3} disabled={isSaving} />
        </div>

        <Button type="submit" className="w-full min-h-12" disabled={isSaving || !name}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />更新中...</> : '商品を更新'}
        </Button>
      </form>
    </div>
  )
}
