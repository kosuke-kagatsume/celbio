import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { findElectriciansForAddress } from '@/lib/area-matching'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/projects/[id]/assign-electrician — 候補の電気工事屋一覧 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      select: { address: true },
    })

    if (!project?.address) {
      return NextResponse.json({ error: '案件の住所が設定されていません' }, { status: 400 })
    }

    const candidates = await findElectriciansForAddress(project.address)

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('Error finding electricians:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
