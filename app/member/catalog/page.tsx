'use client'

import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Search, ShoppingCart } from 'lucide-react'
import { ProductCard } from '@/components/catalog/product-card'
import { useCart } from '@/components/catalog/cart-provider'
import type { CatalogProduct } from '@/lib/catalog'
import Link from 'next/link'

interface Category { id: string; name: string }
interface Pagination { page: number; limit: number; total: number; totalPages: number }

export default function MemberCatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [page, setPage] = useState(1)
  const { addToCart, itemCount } = useCart()

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId)

      const res = await fetch(`/api/member/catalog?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setCategories(data.categories)
        setPagination(data.pagination)
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, search, categoryId])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryId(value)
    setPage(1)
  }

  const handleAddToCart = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    addToCart({
      productId: product.id,
      name: product.name,
      code: product.code,
      unit: product.unit,
      memberUnitPrice: product.memberUnitPrice,
      partnerName: product.partnerName,
    }, quantity)
  }

  const handleQuoteRequest = (productId: string) => {
    // TODO: 見積依頼フローへの導線
    const product = products.find((p) => p.id === productId)
    if (product) {
      window.location.href = `/member/quotes?product=${productId}`
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">商材カタログ</h1>
          <p className="text-sm text-gray-500 mt-1">承認済み商材の検索・発注</p>
        </div>
        <Link href="/member/catalog/cart">
          <Button variant="outline" className="relative min-h-12">
            <ShoppingCart className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">カート</span>
            {itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {itemCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="商品名・商品コードで検索"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 min-h-12"
          />
        </div>
        <Select value={categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="min-h-12 sm:w-48">
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのカテゴリ</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 検索結果件数 */}
      {pagination && (
        <p className="text-sm text-gray-500 mb-4">
          {pagination.total}件の商品{search && `（「${search}」で検索）`}
        </p>
      )}

      {/* 商品一覧 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          {search ? '検索条件に一致する商品がありません' : '掲載中の商品がありません'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuoteRequest={handleQuoteRequest}
              />
            ))}
          </div>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline" size="sm" className="min-h-10"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                前へ
              </Button>
              <span className="flex items-center text-sm text-gray-500">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline" size="sm" className="min-h-10"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                次へ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
