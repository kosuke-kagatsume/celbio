import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { validateProductInput, ProductCreateInput } from '@/lib/products'

// メーカー自社商品一覧
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'partner' || !user.partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { partnerId: user.partnerId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true, code: true, name: true, unit: true, unitPrice: true,
          productType: true, isActive: true, description: true, createdAt: true,
          category: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching partner products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// メーカー商品登録（isActive=false固定）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'partner' || !user.partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as ProductCreateInput
    const validationError = validateProductInput(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // コード重複チェック
    const existing = await prisma.product.findUnique({ where: { code: body.code } })
    if (existing) {
      return NextResponse.json({ error: 'この商品コードは既に使用されています' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        partnerId: user.partnerId,
        categoryId: body.categoryId,
        code: body.code,
        name: body.name,
        productType: body.productType,
        unit: body.unit || null,
        unitPrice: body.productType === 'TYPE_A' ? body.unitPrice : null,
        description: body.description || null,
        specifications: body.specifications ? JSON.parse(body.specifications) : null,
        isActive: false, // 必ずfalse。承認後にadminがtrueにする
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating partner product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
