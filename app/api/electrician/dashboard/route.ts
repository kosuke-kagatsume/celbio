import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getProjectIdsForElectrician } from '@/lib/area-matching'

/** GET /api/electrician/dashboard — ダッシュボードKPI */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'electrician' || !user.partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectIds = await getProjectIdsForElectrician(user.partnerId)

    // 担当エリア数
    const areaCount = await prisma.areaMapping.count({
      where: { partnerId: user.partnerId, isActive: true },
    })

    if (projectIds.length === 0) {
      return NextResponse.json({
        orderCount: 0,
        activeCount: 0,
        areaCount,
        recentOrders: [],
      })
    }

    // 発注数（draft以外）
    const orderCount = await prisma.order.count({
      where: { projectId: { in: projectIds }, status: { not: 'draft' } },
    })

    // 施工対応中（ordered / confirmed / shipped）
    const activeCount = await prisma.order.count({
      where: {
        projectId: { in: projectIds },
        status: { in: ['ordered', 'confirmed', 'shipped'] },
      },
    })

    // 直近の発注
    const recentOrders = await prisma.order.findMany({
      where: { projectId: { in: projectIds }, status: { not: 'draft' } },
      include: {
        project: { select: { projectNumber: true, clientName: true, address: true } },
        member: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      orderCount,
      activeCount,
      areaCount,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        orderedAt: o.orderedAt?.toISOString() ?? null,
        project: o.project ? {
          projectNumber: o.project.projectNumber,
          clientName: o.project.clientName,
          address: o.project.address,
        } : null,
        memberName: o.member.name,
      })),
    })
  } catch (error) {
    console.error('Error fetching electrician dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
