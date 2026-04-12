import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { checkPaymentGate } from '@/lib/orders'

type RouteParams = { params: Promise<{ id: string }> }

/** POST /api/orders/[id]/confirm — 発注確定（前入金ゲートチェック） */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // admin のみ発注確定可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: '管理者のみ発注確定できます' }, { status: 403 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, projectId: true },
    })

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 })
    }

    if (order.status !== 'draft') {
      return NextResponse.json({ error: '下書き状態の発注のみ確定できます' }, { status: 400 })
    }

    // ���入金ゲートチェック
    if (order.projectId) {
      const gate = await checkPaymentGate(order.projectId)
      if (!gate.passed) {
        return NextResponse.json({
          error: '入金が確認されていません。入金確認後に発注を確定してください。',
        }, { status: 400 })
      }
    }

    // 発注確定
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'ordered',
        orderedAt: new Date(),
      },
    })

    // 案���ステータスを「発注済」に更新
    if (order.projectId) {
      await prisma.project.update({
        where: { id: order.projectId },
        data: { status: 'ordered' },
      })
    }

    return NextResponse.json({ message: '発注を確定しました', order: updated })
  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
