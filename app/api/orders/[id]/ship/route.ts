import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

/** POST /api/orders/[id]/ship — 出荷報告（メーカーのみ） */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'partner' || !user.partnerId) {
      return NextResponse.json({ error: 'メーカーのみ出荷報告できます' }, { status: 403 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 })
    }

    // 自社の明細があるか確認
    const myItems = order.items.filter((i) => i.partnerId === user.partnerId)
    if (myItems.length === 0) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 })
    }

    // confirmed 状態のみ出荷可能
    if (order.status !== 'confirmed') {
      return NextResponse.json({ error: '受注確認済の発注のみ出荷報告できます' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // 自社の明細を出荷済みに更新
      for (const item of myItems) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { status: 'shipped', shippedAt: new Date() },
        })
      }

      // 全明細が出荷済みなら発注ステータスも更新
      const allItems = await tx.orderItem.findMany({ where: { orderId: id } })
      const allShipped = allItems.every((i) => i.status === 'shipped')
      if (allShipped) {
        await tx.order.update({
          where: { id },
          data: { status: 'shipped' },
        })
      }
    })

    return NextResponse.json({ message: '出荷報告しました' })
  } catch (error) {
    console.error('Error shipping order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
