import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/projects/[id]/payments — 案件の入金一覧 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    const payments = await prisma.memberPayment.findMany({
      where: { projectId },
      include: {
        confirmer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/projects/[id]/payments — 入��記録作成（管理者のみ） */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: '管理者のみ入金を記録できます' }, { status: 403 })
    }

    const { id: projectId } = await params
    const body = await request.json()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, memberId: true },
    })

    if (!project) {
      return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })
    }

    const payment = await prisma.memberPayment.create({
      data: {
        projectId,
        memberId: project.memberId,
        amount: body.amount,
        paymentType: body.paymentType ?? 'prepayment',
        note: body.note ?? null,
        status: 'pending',
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
