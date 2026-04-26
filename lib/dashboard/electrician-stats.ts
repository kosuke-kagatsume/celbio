import { prisma } from '@/lib/prisma'
import { getProjectIdsForElectrician } from '@/lib/area-matching'

export interface ElectricianRecentOrder {
  id: string
  orderNumber: string
  status: string
  orderedAt: string | null
  project: { projectNumber: string; clientName: string; address: string | null } | null
  memberName: string
}

export interface ElectricianDashboardStats {
  orderCount: number
  activeCount: number
  areaCount: number
  recentOrders: ElectricianRecentOrder[]
}

export async function getElectricianDashboardStats(partnerId: string): Promise<ElectricianDashboardStats> {
  const projectIds = await getProjectIdsForElectrician(partnerId)

  const areaCount = await prisma.areaMapping.count({
    where: { partnerId, isActive: true },
  })

  if (projectIds.length === 0) {
    return { orderCount: 0, activeCount: 0, areaCount, recentOrders: [] }
  }

  const [orderCount, activeCount, recentOrders] = await Promise.all([
    prisma.order.count({
      where: { projectId: { in: projectIds }, status: { not: 'draft' } },
    }),
    prisma.order.count({
      where: {
        projectId: { in: projectIds },
        status: { in: ['ordered', 'confirmed', 'shipped'] },
      },
    }),
    prisma.order.findMany({
      where: { projectId: { in: projectIds }, status: { not: 'draft' } },
      include: {
        project: { select: { projectNumber: true, clientName: true, address: true } },
        member: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
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
  }
}
