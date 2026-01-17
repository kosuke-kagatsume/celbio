import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 見積詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true, code: true, address: true, phone: true } },
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, code: true, flowType: true } },
        items: {
          include: {
            partner: { select: { id: true, name: true, code: true } },
            product: { select: { id: true, name: true, code: true } },
          },
        },
        files: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: '見積が見つかりません' }, { status: 404 });
    }

    // アクセス権チェック
    if (user.role === 'member' && quote.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    if (user.role === 'partner') {
      const hasAccess = quote.items.some(item => item.partnerId === user.partnerId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
      }
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 見積更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json({ error: '見積が見つかりません' }, { status: 404 });
    }

    // 権限チェック
    if (user.role === 'member') {
      if (quote.memberId !== user.memberId) {
        return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
      }
      // 下書き状態のみ編集可能
      if (quote.status !== 'draft') {
        return NextResponse.json({ error: '下書き状態の見積のみ編集できます' }, { status: 400 });
      }
    }

    const { title, description, deliveryAddress, desiredDate, status, items } = body;

    // 見積更新
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // 基本情報更新
      const updated = await tx.quote.update({
        where: { id },
        data: {
          title: title !== undefined ? title : quote.title,
          description: description !== undefined ? description : quote.description,
          deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : quote.deliveryAddress,
          desiredDate: desiredDate !== undefined ? (desiredDate ? new Date(desiredDate) : null) : quote.desiredDate,
          status: status !== undefined ? status : quote.status,
        },
      });

      // 明細の更新（提供された場合）
      if (items && Array.isArray(items)) {
        // 既存の明細を削除
        await tx.quoteItem.deleteMany({ where: { quoteId: id } });

        // 新しい明細を作成
        for (const item of items) {
          await tx.quoteItem.create({
            data: {
              quoteId: id,
              partnerId: item.partnerId,
              productId: item.productId || null,
              itemName: item.itemName,
              specification: item.specification,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              status: item.status || 'pending',
            },
          });
        }
      }

      return updated;
    });

    // 更新後の見積を取得
    const result = await prisma.quote.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        items: {
          include: {
            partner: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 見積削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      return NextResponse.json({ error: '見積が見つかりません' }, { status: 404 });
    }

    // 加盟店ユーザーは自分の下書きのみ削除可能
    if (user.role === 'member') {
      if (quote.memberId !== user.memberId) {
        return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
      }
      if (quote.status !== 'draft') {
        return NextResponse.json({ error: '下書き状態の見積のみ削除できます' }, { status: 400 });
      }
    }

    // 管理者は全削除可能
    if (user.role !== 'admin' && user.role !== 'member') {
      return NextResponse.json({ error: '削除権限がありません' }, { status: 403 });
    }

    await prisma.quote.delete({ where: { id } });

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
