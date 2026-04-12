import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateProjectNumber } from '@/lib/projects'

/** GET /api/projects — 案件一覧（ロール別フィルタ） */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const skip = (page - 1) * limit

    // ロール別フィルタ
    const where: Record<string, unknown> = {}
    if (user.role === 'member' && user.memberId) {
      where.memberId = user.memberId
    }
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { projectNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          member: { select: { id: true, name: true } },
          _count: { select: { quotes: true, orders: true, files: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/projects — 案件作成（工務店のみ） */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'member' || !user.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const projectNumber = await generateProjectNumber()

    const project = await prisma.project.create({
      data: {
        projectNumber,
        memberId: user.memberId,
        createdByUserId: user.id,
        clientName: body.clientName,
        clientNameKana: body.clientNameKana ?? null,
        postalCode: body.postalCode ?? null,
        address: body.address ?? null,
        addressDetail: body.addressDetail ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        buildingType: body.buildingType ?? null,
        roofType: body.roofType ?? null,
        notes: body.notes ?? null,
        status: 'registered',
      },
      include: {
        member: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
