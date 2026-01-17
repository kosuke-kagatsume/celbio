import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// メッセージ返信
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: threadId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'メッセージを入力してください' },
        { status: 400 }
      );
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
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

    if (thread.status === 'closed') {
      return NextResponse.json(
        { error: 'このスレッドはクローズされています' },
        { status: 400 }
      );
    }

    // メッセージ作成
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: user.id,
        content,
        isAdminVisible: true,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        files: true,
      },
    });

    // スレッドの更新日時を更新
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
