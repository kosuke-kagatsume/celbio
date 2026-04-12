import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

/** GET /api/admin/margin-rates — マージン係数一覧 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const partnerId = searchParams.get('partnerId')
    const categoryId = searchParams.get('categoryId')

    const where: Record<string, unknown> = {}
    if (partnerId) where.partnerId = partnerId
    if (categoryId) where.categoryId = categoryId

    const rates = await prisma.marginRate.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ partnerId: 'asc' }, { categoryId: 'asc' }, { productId: 'asc' }],
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching margin rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/admin/margin-rates — マージン係数作成 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const rate = await prisma.marginRate.create({
      data: {
        partnerId: body.partnerId || null,
        categoryId: body.categoryId || null,
        productId: body.productId || null,
        itemType: body.itemType ?? 'material',
        costRatio: body.costRatio,
        fixedAddition: body.fixedAddition ?? 0,
        roundingUnit: body.roundingUnit ?? -3,
        description: body.description ?? null,
        isActive: body.isActive ?? true,
      },
      include: {
        partner: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(rate, { status: 201 })
  } catch (error) {
    console.error('Error creating margin rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PUT /api/admin/margin-rates — マージン係数更新 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
    }

    const rate = await prisma.marginRate.update({
      where: { id: body.id },
      data: {
        partnerId: body.partnerId !== undefined ? (body.partnerId || null) : undefined,
        categoryId: body.categoryId !== undefined ? (body.categoryId || null) : undefined,
        productId: body.productId !== undefined ? (body.productId || null) : undefined,
        itemType: body.itemType,
        costRatio: body.costRatio,
        fixedAddition: body.fixedAddition,
        roundingUnit: body.roundingUnit,
        description: body.description,
        isActive: body.isActive,
      },
      include: {
        partner: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error updating margin rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/admin/margin-rates — マージン係数削除 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
    }

    await prisma.marginRate.delete({ where: { id } })

    return NextResponse.json({ message: '削除しました' })
  } catch (error) {
    console.error('Error deleting margin rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
