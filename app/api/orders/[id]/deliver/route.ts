import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

/** POST /api/orders/[id]/deliver — 納品確認（管理者 or 工務��） */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 })
    }

    // 管理者 or 自社の発注のみ
    if (user.role === 'member' && order.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 })
    }
    if (user.role !== 'admin' && user.role !== 'member') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    if (order.status !== 'shipped') {
      return NextResponse.json({ error: '出荷済の発注のみ納品確認できます' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 全明細を納品済に
      await tx.orderItem.updateMany({
        where: { orderId: id },
        data: { status: 'delivered', deliveredAt: new Date() },
      })

      await tx.order.update({
        where: { id },
        data: { status: 'delivered' },
      })
    })

    return NextResponse.json({ message: '納品を確認しました' })
  } catch (error) {
    console.error('Error delivering order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
