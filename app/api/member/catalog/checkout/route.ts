import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calcItemMemberPrice } from '@/lib/margin'
import { notifyOrderCreated } from '@/lib/notifications'

// カート発注（Type A商品のみ・サーバー側価格検証）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'member' || !user.memberId) {
      return NextResponse.json({ error: '加盟店ユーザーのみ発注できます' }, { status: 403 })
    }

    const body = await request.json()
    const { deliveryAddress, desiredDate, note, items } = body as {
      deliveryAddress: string
      desiredDate?: string
      note?: string
      items: { productId: string; quantity: number }[]
    }

    if (!deliveryAddress || !items || items.length === 0) {
      return NextResponse.json({ error: '配送先と商品を指定してください' }, { status: 400 })
    }

    // 商品をDB取得して検証
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
      },
    })

    // 全商品が存在・承認済み・TYPE_Aか検証
    const productMap = new Map(products.map((p) => [p.id, p]))
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: `商品が見つかりません: ${item.productId}` }, { status: 400 })
      }
      if (product.productType !== 'TYPE_A') {
        return NextResponse.json(
          { error: `${product.name} は見積依頼が必要な商品です` },
          { status: 400 }
        )
      }
      if (item.quantity < 1) {
        return NextResponse.json({ error: '数量は1以上を指定してください' }, { status: 400 })
      }
    }

    // サーバー側でマージン計算（クライアント価格は信用しない）
    const orderItems: {
      partnerId: string; productId: string; itemName: string
      unit: string | null; quantity: number; unitPrice: number
      memberUnitPrice: number; subtotal: number; memberSubtotal: number
    }[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)!
      const unitPrice = product.unitPrice ? Number(product.unitPrice) : 0
      const margin = await calcItemMemberPrice({
        partnerId: product.partnerId,
        categoryId: product.categoryId,
        productId: product.id,
        unitPrice,
      })

      orderItems.push({
        partnerId: product.partnerId,
        productId: product.id,
        itemName: product.name,
        unit: product.unit,
        quantity: item.quantity,
        unitPrice,
        memberUnitPrice: margin.memberPrice,
        subtotal: unitPrice * item.quantity,
        memberSubtotal: margin.memberPrice * item.quantity,
      })
    }

    const totalAmount = orderItems.reduce((sum, i) => sum + i.memberSubtotal, 0)

    // 発注番号生成
    const today = new Date()
    const datePrefix = `O${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const todayCount = await prisma.order.count({
      where: { orderNumber: { startsWith: datePrefix } },
    })
    const orderNumber = `${datePrefix}-${String(todayCount + 1).padStart(4, '0')}`

    // トランザクションでOrder + OrderItem作成
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          memberId: user.memberId!,
          userId: user.id,
          status: 'draft', // 前入金ゲートあり
          deliveryAddress,
          desiredDate: desiredDate ? new Date(desiredDate) : null,
          note: note || null,
          totalAmount,
          orderedAt: new Date(),
        },
      })

      for (const item of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            partnerId: item.partnerId,
            productId: item.productId,
            itemName: item.itemName,
            specification: null,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            status: 'pending',
          },
        })
      }

      return newOrder
    })

    notifyOrderCreated(order.id)

    return NextResponse.json(
      { orderId: order.id, orderNumber: order.orderNumber, totalAmount },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating catalog order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
