import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calcItemMemberPrice } from '@/lib/margin'
import type { CatalogProduct } from '@/lib/catalog'

// 承認済み商品一覧（memberUnitPrice付き）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (categoryId) {
      where.categoryId = categoryId
    }

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          partner: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    // マージン計算して memberUnitPrice を付与（原価は絶対に返さない）
    const catalogProducts: CatalogProduct[] = await Promise.all(
      products.map(async (p) => {
        const unitPrice = p.unitPrice ? Number(p.unitPrice) : 0
        const margin = await calcItemMemberPrice({
          partnerId: p.partnerId,
          categoryId: p.categoryId,
          productId: p.id,
          unitPrice,
        })
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          unit: p.unit,
          memberUnitPrice: margin.memberPrice,
          productType: p.productType,
          categoryName: p.category.name,
          partnerName: p.partner.name,
          specifications: p.specifications as Record<string, string> | null,
        }
      })
    )

    return NextResponse.json({
      products: catalogProducts,
      categories,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching catalog:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
