'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Package } from 'lucide-react'

interface Product {
  id: string
  code: string
  name: string
  unit: string | null
  unitPrice: string | null
  productType: string
  isActive: boolean
  category: { id: string; name: string; code: string }
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

export default function PartnerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchProducts() }, [statusFilter, page])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('isActive', statusFilter)
      params.set('page', String(page))
      const res = await fetch(`/api/partner/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setPagination(data.pagination)
      }
    } finally { setIsLoading(false) }
  }

  const approvedCount = products.filter((p) => p.isActive).length
  const pendingCount = products.filter((p) => !p.isActive).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">商材管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            自社商品の登録・管理 {pagination ? `(${pagination.total}件)` : ''}
          </p>
        </div>
        <Link href="/partner/products/new">
          <Button className="min-h-12">
            <Plus className="mr-2 h-4 w-4" />
            商品登録
          </Button>
        </Link>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
        登録した商品はセリビオ管理者の承認後にカタログに掲載されます
      </div>

      <div className="mb-4">
        <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="min-h-12"><SelectValue placeholder="ステータスで絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="true">承認済み ({approvedCount})</SelectItem>
            <SelectItem value="false">承認待ち ({pendingCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-400 py-8">商品が登録されていません</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Link key={p.id} href={`/partner/products/${p.id}/edit`}>
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                      <Badge variant={p.isActive ? 'default' : 'outline'} className={`text-xs ${p.isActive ? 'bg-green-600' : 'text-yellow-600 border-yellow-300'}`}>
                        {p.isActive ? '承認済み' : '承認待ち'}
                      </Badge>
                    </div>
                    {p.unitPrice && (
                      <p className="text-sm text-gray-600 mt-1">
                        ¥{Number(p.unitPrice).toLocaleString()}{p.unit ? ` /${p.unit}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>前へ</Button>
          <span className="flex items-center text-sm text-gray-500">{page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>次へ</Button>
        </div>
      )}
    </div>
  )
}
