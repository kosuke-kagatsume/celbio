'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Check, X, Package } from 'lucide-react'

interface Product {
  id: string; code: string; name: string; unit: string | null; unitPrice: string | null
  productType: string; isActive: boolean; createdAt: string
  category: { id: string; name: string; code: string }
  partner: { id: string; name: string; code: string }
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

export default function AdminCatalogPage() {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([])
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([])
  const [pendingPagination, setPendingPagination] = useState<Pagination | null>(null)
  const [publishedPagination, setPublishedPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'published'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [pendingRes, publishedRes] = await Promise.all([
        fetch('/api/admin/products?isActive=false&limit=100'),
        fetch('/api/admin/products?isActive=true&limit=100'),
      ])
      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingProducts(data.products)
        setPendingPagination(data.pagination)
      }
      if (publishedRes.ok) {
        const data = await publishedRes.json()
        setPublishedProducts(data.products)
        setPublishedPagination(data.pagination)
      }
    } finally { setIsLoading(false) }
  }

  const handleToggle = async (productId: string, isActive: boolean) => {
    setActionLoading(productId)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (res.ok) fetchAll()
    } finally { setActionLoading(null) }
  }

  const currentProducts = tab === 'pending' ? pendingProducts : publishedProducts
  const currentPagination = tab === 'pending' ? pendingPagination : publishedPagination

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">カタログ承認</h1>
        <p className="text-sm text-gray-500 mt-1">メーカー登録商品の承認・掲載管理</p>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingPagination?.total ?? 0}</p>
          <p className="text-xs text-gray-500">承認待ち</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{publishedPagination?.total ?? 0}</p>
          <p className="text-xs text-gray-500">掲載中</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{(pendingPagination?.total ?? 0) + (publishedPagination?.total ?? 0)}</p>
          <p className="text-xs text-gray-500">全商品</p>
        </div>
      </div>

      {/* タブ */}
      <div className="mb-4">
        <Select value={tab} onValueChange={(v) => setTab(v as 'pending' | 'published')}>
          <SelectTrigger className="min-h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">承認待ち ({pendingPagination?.total ?? 0})</SelectItem>
            <SelectItem value="published">掲載中 ({publishedPagination?.total ?? 0})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 一覧 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : currentProducts.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          {tab === 'pending' ? '承認待ちの商品はありません' : '掲載中の商品はありません'}
        </p>
      ) : (
        <div className="space-y-3">
          {currentProducts.map((p) => (
            <div key={p.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Package className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{p.code}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{p.category.name}</Badge>
                    <Badge variant={p.productType === 'TYPE_A' ? 'default' : 'secondary'} className="text-xs">
                      {p.productType === 'TYPE_A' ? '即発注' : '見積必要'}
                    </Badge>
                    <span className="text-xs text-gray-400">{p.partner.name}</span>
                  </div>
                  {p.unitPrice && (
                    <p className="text-sm text-gray-600 mt-1">¥{Number(p.unitPrice).toLocaleString()}{p.unit ? ` /${p.unit}` : ''}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString('ja-JP')} 登録
                  </p>
                </div>
                <div className="shrink-0">
                  {tab === 'pending' ? (
                    <Button
                      size="sm" className="min-h-10 bg-green-600 hover:bg-green-700"
                      disabled={actionLoading === p.id}
                      onClick={() => handleToggle(p.id, true)}
                    >
                      {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" />承認</>}
                    </Button>
                  ) : (
                    <Button
                      size="sm" variant="outline" className="min-h-10"
                      disabled={actionLoading === p.id}
                      onClick={() => handleToggle(p.id, false)}
                    >
                      {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="mr-1 h-4 w-4" />非公開</>}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
