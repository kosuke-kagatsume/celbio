import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// スレッド詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const thread = await prisma.messageThread.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderNumber: true } },
        quote: { select: { id: true, quoteNumber: true } },
        member: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true, role: true } },
            files: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'スレッドが見つかりません' }, { status: 404 });
    }

    // 権限チェック
    if (user.role === 'member' && thread.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }
    if (user.role === 'partner' && thread.partnerId !== user.partnerId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// スレッドステータス更新（クローズ等）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const thread = await prisma.messageThread.findUnique({
      where: { id },
    });

    if (!thread) {
      return NextResponse.json({ error: 'スレッドが見つかりません' }, { status: 404 });
    }

    // 権限チェック（管理者のみクローズ可能）
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'この操作は管理者のみ可能です' }, { status: 403 });
    }

    const updated = await prisma.messageThread.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
