import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateQuoteNumber } from '@/lib/quotes'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/projects/[id]/quotes — 案件に紐づく見積一覧 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const quotes = await prisma.quote.findMany({
      where: { projectId: id },
      include: {
        category: { select: { id: true, name: true } },
        items: {
          include: {
            partner: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
        },
        _count: { select: { files: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // member ロールには原価を隠す
    if (user.role === 'member') {
      const sanitized = quotes.map((q) => ({
        ...q,
        totalAmount: undefined,
        items: q.items.map((item) => ({
          ...item,
          unitPrice: undefined,
          subtotal: undefined,
        })),
      }))
      return NextResponse.json(sanitized)
    }

    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/projects/[id]/quotes — 見積作成 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // member または admin のみ
    if (user.role !== 'member' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: projectId } = await params
    const body = await request.json()

    // 案件の存在確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, memberId: true, address: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // member は自分の案件のみ
    if (user.role === 'member' && project.memberId !== user.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const quoteNumber = await generateQuoteNumber()

    // 見積明細の準備
    const items = (body.items as Array<{
      partnerId: string
      productId?: string
      itemType?: string
      itemName: string
      specification?: string
      quantity?: number
      unit?: string
    }>) ?? []

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        projectId,
        memberId: project.memberId,
        userId: user.id,
        categoryId: body.categoryId,
        status: 'requested',
        title: body.title ?? null,
        description: body.description ?? null,
        deliveryAddress: body.deliveryAddress ?? project.address ?? null,
        desiredDate: body.desiredDate ? new Date(body.desiredDate) : null,
        items: {
          create: items.map((item) => ({
            partnerId: item.partnerId,
            productId: item.productId ?? null,
            itemType: item.itemType ?? 'material',
            itemName: item.itemName,
            specification: item.specification ?? null,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            status: 'pending',
          })),
        },
      },
      include: {
        items: true,
        category: { select: { id: true, name: true } },
      },
    })

    // 案件ステータスを「見積依頼中」に更新
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'quoting' },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
