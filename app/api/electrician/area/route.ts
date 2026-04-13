import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

/** GET /api/electrician/area — 担当エリア一覧 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'electrician' || !user.partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const areas = await prisma.areaMapping.findMany({
      where: { partnerId: user.partnerId },
      orderBy: [{ prefecture: 'asc' }, { city: 'asc' }],
      select: {
        id: true,
        prefecture: true,
        city: true,
        priority: true,
        isActive: true,
      },
    })

    return NextResponse.json({ areas })
  } catch (error) {
    console.error('GET /api/electrician/area error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
