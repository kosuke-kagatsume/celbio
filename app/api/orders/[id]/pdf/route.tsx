import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { OrderPdfDocument, type OrderPdfData } from '@/lib/pdf/order-pdf'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/orders/[id]/pdf — 発注書PDF生成・ダウンロード */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者のみ発注書PDFを生成可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: '管理者のみ発注書PDFを生成できます' }, { status: 403 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            partner: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: '発注が見つかりません' }, { status: 404 })
    }

    // メーカーごとにグループ化してPDF生成（メーカーごとに発注書を出す想定だが、まずは1つのPDFにまとめる）
    const partnerNames = [...new Set(order.items.map((i) => i.partner.name))]
    const partnerName = partnerNames.length === 1 ? partnerNames[0] : partnerNames.join(' / ')

    const pdfItems = order.items.map((i) => ({
      itemName: i.itemName,
      specification: i.specification,
      quantity: Number(i.quantity),
      unit: i.unit,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
      partnerName: i.partner.name,
    }))

    const subtotalAmount = pdfItems.reduce((sum, i) => sum + i.subtotal, 0)
    const taxAmount = Math.floor(subtotalAmount * 0.1)
    const totalAmount = subtotalAmount + taxAmount

    const pdfData: OrderPdfData = {
      orderNumber: order.orderNumber,
      orderedAt: order.orderedAt?.toISOString() ?? null,
      desiredDate: order.desiredDate?.toISOString() ?? null,
      deliveryAddress: order.deliveryAddress,
      note: order.note,
      partnerName,
      items: pdfItems,
      subtotalAmount,
      taxAmount,
      totalAmount,
    }

    const buffer = await renderToBuffer(<OrderPdfDocument data={pdfData} />)
    const bytes = new Uint8Array(buffer)

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${order.orderNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating order PDF:', error)
    return NextResponse.json({ error: 'PDF生成に失敗しました' }, { status: 500 })
  }
}
