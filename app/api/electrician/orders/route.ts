import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getProjectIdsForElectrician } from '@/lib/area-matching'

/** GET /api/electrician/orders — 担当エリアの発注一覧 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'electrician' || !user.partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    // 担当エリアの案件IDを取得
    const projectIds = await getProjectIdsForElectrician(user.partnerId)

    if (projectIds.length === 0) {
      return NextResponse.json({
        orders: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    const where = {
      projectId: { in: projectIds },
      ...(status && { status }),
      // draft以外のみ表示（入金確認前のdraftは見せない）
      ...(!status && { status: { not: 'draft' } }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          project: {
            select: { id: true, projectNumber: true, clientName: true, address: true },
          },
          member: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount.toString(),
        createdAt: o.createdAt.toISOString(),
        orderedAt: o.orderedAt?.toISOString() ?? null,
        project: o.project ? {
          id: o.project.id,
          projectNumber: o.project.projectNumber,
          clientName: o.project.clientName,
          address: o.project.address,
        } : null,
        member: { id: o.member.id, name: o.member.name },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching electrician orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
