import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

/** GET /api/admin/area-mappings — エリアマッピング一覧 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const prefecture = searchParams.get('prefecture') || undefined

    const mappings = await prisma.areaMapping.findMany({
      where: prefecture ? { prefecture } : undefined,
      include: {
        partner: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ prefecture: 'asc' }, { city: 'asc' }, { priority: 'desc' }],
    })

    return NextResponse.json({ mappings })
  } catch (error) {
    console.error('Error fetching area mappings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/admin/area-mappings — エリアマッピング作成 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { partnerId, prefecture, city, priority } = body

    if (!partnerId || !prefecture) {
      return NextResponse.json({ error: 'partnerId, prefecture は必須です' }, { status: 400 })
    }

    const mapping = await prisma.areaMapping.create({
      data: {
        partnerId,
        prefecture,
        city: city || null,
        priority: priority ?? 0,
      },
      include: {
        partner: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json(mapping, { status: 201 })
  } catch (error) {
    console.error('Error creating area mapping:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PUT /api/admin/area-mappings — エリアマッピング更新 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, partnerId, prefecture, city, priority, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'id は必須です' }, { status: 400 })
    }

    const mapping = await prisma.areaMapping.update({
      where: { id },
      data: {
        ...(partnerId !== undefined && { partnerId }),
        ...(prefecture !== undefined && { prefecture }),
        ...(city !== undefined && { city: city || null }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        partner: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json(mapping)
  } catch (error) {
    console.error('Error updating area mapping:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/admin/area-mappings — エリアマッピング削除 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id は必須です' }, { status: 400 })
    }

    await prisma.areaMapping.delete({ where: { id } })

    return NextResponse.json({ message: '削除しました' })
  } catch (error) {
    console.error('Error deleting area mapping:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
