import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// メーカーが見積回答（価格入力）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // メーカーユーザーのみ回答可能
    if (user.role !== 'partner' || !user.partnerId) {
      return NextResponse.json(
        { error: 'メーカーユーザーのみ回答できます' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: '明細情報が必要です' }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json({ error: '見積が見つかりません' }, { status: 404 });
    }

    // 自社が関連する見積か確認
    const partnerItems = quote.items.filter(item => item.partnerId === user.partnerId);
    if (partnerItems.length === 0) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    // 見積依頼状態か確認
    if (quote.status !== 'requested') {
      return NextResponse.json(
        { error: '依頼中の見積のみ回答できます' },
        { status: 400 }
      );
    }

    // 明細を更新
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        // 自社の明細のみ更新可能
        const existingItem = partnerItems.find(pi => pi.id === item.id);
        if (!existingItem) continue;

        const unitPrice = item.unitPrice ? parseFloat(item.unitPrice) : null;
        const quantity = existingItem.quantity ? parseFloat(existingItem.quantity.toString()) : null;
        const subtotal = unitPrice && quantity ? unitPrice * quantity : null;

        await tx.quoteItem.update({
          where: { id: item.id },
          data: {
            unitPrice,
            subtotal,
            specification: item.specification || existingItem.specification,
            status: 'quoted',
            quotedAt: new Date(),
          },
        });
      }

      // 全ての明細が回答済みか確認
      const allItems = await tx.quoteItem.findMany({
        where: { quoteId: id },
      });
      const allQuoted = allItems.every(item => item.status === 'quoted');

      if (allQuoted) {
        // 合計金額を計算
        const totalAmount = allItems.reduce((sum, item) => {
          return sum + (item.subtotal ? parseFloat(item.subtotal.toString()) : 0);
        }, 0);

        // 見積ステータスを更新
        await tx.quote.update({
          where: { id },
          data: {
            status: 'responded',
            totalAmount,
          },
        });
      }
    });

    // 更新後の見積を取得
    const updatedQuote = await prisma.quote.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        items: {
          include: {
            partner: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('Error responding to quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
