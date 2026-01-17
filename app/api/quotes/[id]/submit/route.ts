import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 見積依頼を提出（draft → requested）
export async function POST(
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
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json({ error: '見積が見つかりません' }, { status: 404 });
    }

    // 加盟店ユーザーのみ提出可能
    if (user.role !== 'member' || quote.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    // 下書き状態のみ提出可能
    if (quote.status !== 'draft') {
      return NextResponse.json({ error: '下書き状態の見積のみ提出できます' }, { status: 400 });
    }

    // 明細が存在するか確認
    if (quote.items.length === 0) {
      return NextResponse.json({ error: '見積明細を追加してください' }, { status: 400 });
    }

    // ステータス更新
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: { status: 'requested' },
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

    // TODO: メーカーへの通知を送信

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('Error submitting quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
