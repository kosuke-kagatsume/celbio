import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

/** POST /api/admin/projects/[id]/confirm-payment — 入金確認（管理者のみ） */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: projectId } = await params
    const body = await request.json().catch(() => ({}))

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true, paymentConfirmedAt: true },
    })

    if (!project) {
      return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })
    }

    if (project.paymentConfirmedAt) {
      return NextResponse.json({ error: 'すでに入金確認済みです' }, { status: 400 })
    }

    // 案件の入金確認 + ステータス更新
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          paymentConfirmedAt: new Date(),
          status: 'payment_confirmed',
        },
      })

      // 対象の未確認入金レコードを確認済みに
      const paymentId = body.paymentId as string | undefined
      if (paymentId) {
        await tx.memberPayment.update({
          where: { id: paymentId },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: user.id,
          },
        })
      } else {
        // paymentId 未指定: 全ての pending を確認済みに
        await tx.memberPayment.updateMany({
          where: { projectId, status: 'pending' },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: user.id,
          },
        })
      }
    })

    return NextResponse.json({ message: '入金を確認しました' })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
