import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 商品詳細取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'partner' || !user.partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, code: true } } },
    })

    if (!product || product.partnerId !== user.partnerId) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 商品更新（isActive, code変更不可）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'partner' || !user.partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing || existing.partnerId !== user.partnerId) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, unit, unitPrice, productType, specifications } = body

    if (!name) {
      return NextResponse.json({ error: '商品名は必須です' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        unit: unit || null,
        unitPrice: productType === 'TYPE_A' ? unitPrice : null,
        productType: productType || existing.productType,
        specifications: specifications ? JSON.parse(specifications) : existing.specifications,
        // isActive は変更しない（admin専用）
        // code は変更しない
        // partnerId は変更しない
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
