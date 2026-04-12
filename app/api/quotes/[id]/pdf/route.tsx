import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument, type QuotePdfData } from '@/lib/pdf/quote-pdf'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/quotes/[id]/pdf — 見積書PDF生成・ダウンロード */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        project: { select: { projectNumber: true, clientName: true } },
        member: { select: { id: true, name: true } },
        items: {
          include: {
            partner: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: '見積が見つかりません' }, { status: 404 })
    }

    // アクセス権チェック
    if (user.role === 'member' && quote.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 })
    }
    if (user.role === 'partner') {
      const hasAccess = quote.items.some((i) => i.partnerId === user.partnerId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 })
      }
    }

    // 工務店向け: マージン込み価格のみ、メーカー向け: 原価のみ、管理者: マージン込み
    const useMemberPrice = user.role === 'member' || user.role === 'admin'

    const pdfItems = quote.items
      .filter((i) => i.unitPrice != null) // 未回答は除外
      .map((i) => ({
        itemName: i.itemName,
        specification: i.specification,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitPrice: useMemberPrice && i.memberUnitPrice
          ? Number(i.memberUnitPrice)
          : Number(i.unitPrice ?? 0),
        subtotal: useMemberPrice && i.memberSubtotal
          ? Number(i.memberSubtotal)
          : Number(i.subtotal ?? 0),
      }))

    const subtotalAmount = pdfItems.reduce((sum, i) => sum + i.subtotal, 0)
    const taxAmount = Math.floor(subtotalAmount * 0.1)
    const totalAmount = subtotalAmount + taxAmount

    const pdfData: QuotePdfData = {
      quoteNumber: quote.quoteNumber,
      title: quote.title,
      createdAt: quote.createdAt.toISOString(),
      desiredDate: quote.desiredDate?.toISOString() ?? null,
      clientName: quote.project?.clientName ?? quote.member?.name ?? '',
      projectNumber: quote.project?.projectNumber ?? null,
      deliveryAddress: quote.deliveryAddress,
      note: quote.description,
      items: pdfItems,
      subtotalAmount,
      taxAmount,
      totalAmount,
    }

    const buffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />)
    const bytes = new Uint8Array(buffer)

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quoteNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating quote PDF:', error)
    return NextResponse.json({ error: 'PDF生成に失敗しました' }, { status: 500 })
  }
}
