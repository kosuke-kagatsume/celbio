import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { canTransition } from '@/lib/partner-payments'

// 支払詳細取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const payment = await prisma.partnerPayment.findUnique({
      where: { id },
      include: {
        partner: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            invoice: {
              select: {
                id: true, invoiceNumber: true, amount: true, taxAmount: true,
                totalAmount: true, issuedAt: true, dueDate: true, status: true,
                order: { select: { id: true, orderNumber: true } },
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: '支払データが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error fetching partner payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ステータス遷移 + 振込情報更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, transferDate, transferRef } = body

    const payment = await prisma.partnerPayment.findUnique({ where: { id } })
    if (!payment) {
      return NextResponse.json({ error: '支払データが見つかりません' }, { status: 404 })
    }

    if (status && !canTransition(payment.status, status)) {
      return NextResponse.json(
        { error: `${payment.status} → ${status} への遷移はできません` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (transferDate) data.transferDate = new Date(transferDate)
    if (transferRef !== undefined) data.transferRef = transferRef

    const updated = await prisma.partnerPayment.update({
      where: { id },
      data,
      include: {
        partner: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ payment: updated })
  } catch (error) {
    console.error('Error updating partner payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
