'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShoppingCart, FileText, Package } from 'lucide-react'
import type { CatalogProduct } from '@/lib/catalog'

interface ProductCardProps {
  product: CatalogProduct
  onAddToCart: (productId: string, quantity: number) => void
  onQuoteRequest: (productId: string) => void
}

export function ProductCard({ product, onAddToCart, onQuoteRequest }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-400 font-mono">{product.code}</span>
      </div>
      <h3 className="font-medium text-sm leading-tight mb-1">{product.name}</h3>
      <div className="flex items-center gap-1 flex-wrap mb-2">
        <Badge variant="outline" className="text-xs">{product.categoryName}</Badge>
        <span className="text-xs text-gray-400">{product.partnerName}</span>
      </div>

      {product.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
      )}

      {product.productType === 'TYPE_A' ? (
        <>
          <p className="text-lg font-bold mb-2">
            ¥{product.memberUnitPrice.toLocaleString()}
            {product.unit && <span className="text-sm font-normal text-gray-500"> /{product.unit}</span>}
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number" min={1} value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 min-h-10 text-center"
            />
            <Button
              className="flex-1 min-h-10"
              onClick={() => onAddToCart(product.id, quantity)}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              カートに追加
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">価格: 見積依頼が必要</p>
          <Button
            variant="outline" className="w-full min-h-10"
            onClick={() => onQuoteRequest(product.id)}
          >
            <FileText className="mr-1 h-4 w-4" />
            見積依頼
          </Button>
        </>
      )}
    </div>
  )
}
