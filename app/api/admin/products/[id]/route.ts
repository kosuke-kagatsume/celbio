import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// 商品詳細
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin'])
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true, code: true } },
      },
    })

    if (!product) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 商品更新（管理者フル権限）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin'])
    const { id } = await params
    const body = await request.json()

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.unit !== undefined && { unit: body.unit || null }),
        ...(body.unitPrice !== undefined && { unitPrice: body.unitPrice }),
        ...(body.productType !== undefined && { productType: body.productType }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.specifications !== undefined && {
          specifications: body.specifications ? JSON.parse(body.specifications) : null,
        }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 承認/非公開の切替（PATCHで軽量操作）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin'])
    const { id } = await params
    const body = await request.json()

    if (body.isActive === undefined) {
      return NextResponse.json({ error: 'isActive is required' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: body.isActive },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error patching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
