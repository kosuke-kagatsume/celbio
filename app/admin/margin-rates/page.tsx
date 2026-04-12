'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react'

interface MarginRate {
  id: string
  partnerId: string | null
  categoryId: string | null
  productId: string | null
  itemType: string
  costRatio: string
  fixedAddition: string
  roundingUnit: number
  description: string | null
  isActive: boolean
  partner: { id: string; name: string; code: string } | null
  category: { id: string; name: string; code: string } | null
  product: { id: string; name: string; code: string } | null
}

interface SelectOption {
  id: string
  name: string
  code: string
}

interface MarginFormState {
  partnerId: string
  categoryId: string
  productId: string
  itemType: string
  costRatio: string
  fixedAddition: string
  roundingUnit: string
  description: string
}

export default function AdminMarginRatesPage() {
  const [rates, setRates] = useState<MarginRate[]>([])
  const [partners, setPartners] = useState<SelectOption[]>([])
  const [categories, setCategories] = useState<SelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState({
    partnerId: '',
    categoryId: '',
    productId: '',
    itemType: 'material',
    costRatio: '',
    fixedAddition: '0',
    roundingUnit: '-3',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [ratesRes, partnersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/margin-rates'),
        fetch('/api/admin/partners'),
        fetch('/api/admin/categories'),
      ])

      if (ratesRes.ok) setRates(await ratesRes.json())
      if (partnersRes.ok) {
        const data = await partnersRes.json()
        setPartners(Array.isArray(data) ? data : data.partners ?? [])
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(Array.isArray(data) ? data : data.categories ?? [])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ partnerId: '', categoryId: '', productId: '', itemType: 'material', costRatio: '', fixedAddition: '0', roundingUnit: '-3', description: '' })
  }

  const handleAdd = async () => {
    if (!form.costRatio) { alert('原価率を入力してください'); return }
    const res = await fetch('/api/admin/margin-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId: form.partnerId || null,
        categoryId: form.categoryId || null,
        productId: form.productId || null,
        itemType: form.itemType,
        costRatio: parseFloat(form.costRatio),
        fixedAddition: parseFloat(form.fixedAddition || '0'),
        roundingUnit: parseInt(form.roundingUnit),
        description: form.description || null,
      }),
    })
    if (res.ok) {
      setIsAdding(false)
      resetForm()
      fetchData()
    } else {
      const err = await res.json()
      alert(err.error || 'エラーが発生しました')
    }
  }

  const handleUpdate = async (id: string) => {
    const res = await fetch('/api/admin/margin-rates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        partnerId: form.partnerId || null,
        categoryId: form.categoryId || null,
        productId: form.productId || null,
        itemType: form.itemType,
        costRatio: parseFloat(form.costRatio),
        fixedAddition: parseFloat(form.fixedAddition || '0'),
        roundingUnit: parseInt(form.roundingUnit),
        description: form.description || null,
      }),
    })
    if (res.ok) {
      setEditingId(null)
      resetForm()
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このマージン係数を削除しますか？')) return
    const res = await fetch(`/api/admin/margin-rates?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const startEdit = (rate: MarginRate) => {
    setEditingId(rate.id)
    setIsAdding(false)
    setForm({
      partnerId: rate.partnerId ?? '',
      categoryId: rate.categoryId ?? '',
      productId: rate.productId ?? '',
      itemType: rate.itemType,
      costRatio: rate.costRatio,
      fixedAddition: rate.fixedAddition,
      roundingUnit: String(rate.roundingUnit),
      description: rate.description ?? '',
    })
  }

  const roundingLabel = (unit: number) => {
    switch (unit) {
      case -3: return '千円'
      case -4: return '万円'
      case -2: return '百円'
      default: return `10^${Math.abs(unit)}円`
    }
  }

  const scopeLabel = (rate: MarginRate) => {
    if (rate.product) return rate.product.name
    if (rate.partner && rate.category) return `${rate.partner.name} × ${rate.category.name}`
    if (rate.category) return rate.category.name
    if (rate.partner) return rate.partner.name
    return 'デフォルト'
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">マージン係数管理</h1>
          <p className="text-sm text-gray-500 mt-1">原価率・丸め単位・固定額加算の設定 ({rates.length}件)</p>
        </div>
        <Button className="min-h-12" onClick={() => { setIsAdding(true); setEditingId(null); resetForm() }}>
          <Plus className="h-4 w-4 mr-1" /> 追加
        </Button>
      </div>

      {/* 新規追加フォーム */}
      {isAdding && (
        <Card className="mb-4 border-blue-200">
          <CardHeader><CardTitle className="text-lg">新規追加</CardTitle></CardHeader>
          <CardContent>
            <MarginForm
              form={form}
              setForm={setForm}
              partners={partners}
              categories={categories}
              onSave={handleAdd}
              onCancel={() => { setIsAdding(false); resetForm() }}
            />
          </CardContent>
        </Card>
      )}

      {/* 一覧 */}
      <div className="space-y-3">
        {rates.map((rate) => (
          <Card key={rate.id} className={!rate.isActive ? 'opacity-50' : ''}>
            {editingId === rate.id ? (
              <CardContent className="p-4">
                <MarginForm
                  form={form}
                  setForm={setForm}
                  partners={partners}
                  categories={categories}
                  onSave={() => handleUpdate(rate.id)}
                  onCancel={() => { setEditingId(null); resetForm() }}
                />
              </CardContent>
            ) : (
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{scopeLabel(rate)}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {rate.itemType === 'material' ? '物' : '人工'}
                      </span>
                    </div>
                    {rate.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{rate.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      <span>原価率: <strong>{rate.costRatio}</strong></span>
                      <span>丸め: <strong>{roundingLabel(rate.roundingUnit)}</strong></span>
                      {Number(rate.fixedAddition) > 0 && (
                        <span>固定加算: <strong>¥{Number(rate.fixedAddition).toLocaleString('ja-JP')}</strong></span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(rate)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(rate.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {rates.length === 0 && !isAdding && (
          <p className="text-center text-gray-400 py-8">マージン係数が設定されていません</p>
        )}
      </div>
    </div>
  )
}

function MarginForm({
  form,
  setForm,
  partners,
  categories,
  onSave,
  onCancel,
}: {
  form: MarginFormState
  setForm: (f: MarginFormState) => void
  partners: SelectOption[]
  categories: SelectOption[]
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">パートナー</label>
          <Select value={form.partnerId || 'none'} onValueChange={(v) => setForm({ ...form, partnerId: v === 'none' ? '' : v })}>
            <SelectTrigger className="min-h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">全て</SelectItem>
              {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-gray-500">カテゴリ</label>
          <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
            <SelectTrigger className="min-h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">全て</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">種別</label>
          <Select value={form.itemType} onValueChange={(v) => setForm({ ...form, itemType: v })}>
            <SelectTrigger className="min-h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="material">物</SelectItem>
              <SelectItem value="labor">人工</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-gray-500">丸め単位</label>
          <Select value={form.roundingUnit} onValueChange={(v) => setForm({ ...form, roundingUnit: v })}>
            <SelectTrigger className="min-h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="-2">百円単位</SelectItem>
              <SelectItem value="-3">千円単位</SelectItem>
              <SelectItem value="-4">万円単位</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">原価率 *</label>
          <Input
            type="number"
            step="0.01"
            placeholder="例: 0.70"
            value={form.costRatio}
            onChange={(e) => setForm({ ...form, costRatio: e.target.value })}
            className="min-h-12"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">固定額加算（円）</label>
          <Input
            type="number"
            placeholder="例: 5000"
            value={form.fixedAddition}
            onChange={(e) => setForm({ ...form, fixedAddition: e.target.value })}
            className="min-h-12"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500">メモ</label>
        <Input
          placeholder="例: LONGiパネル 30%マージン"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="min-h-12"
        />
      </div>

      <div className="flex gap-2">
        <Button className="flex-1 min-h-12" onClick={onSave}>
          <Check className="h-4 w-4 mr-1" /> 保存
        </Button>
        <Button variant="outline" className="min-h-12" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> キャンセル
        </Button>
      </div>
    </div>
  )
}
