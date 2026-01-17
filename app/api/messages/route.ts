import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// メッセージスレッド一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const threadType = searchParams.get('type');

    // ユーザーの権限に応じてフィルター
    const whereClause: Record<string, unknown> = {};

    if (user.role === 'member') {
      whereClause.memberId = user.memberId;
    } else if (user.role === 'partner') {
      whereClause.partnerId = user.partnerId;
    }
    // adminは全て見れる

    if (status) {
      whereClause.status = status;
    }
    if (threadType) {
      whereClause.threadType = threadType;
    }

    const threads = await prisma.messageThread.findMany({
      where: whereClause,
      include: {
        order: { select: { id: true, orderNumber: true } },
        quote: { select: { id: true, quoteNumber: true } },
        member: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 新規スレッド作成
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, threadType, orderId, quoteId, partnerId, memberId, message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージを入力してください' },
        { status: 400 }
      );
    }

    // スレッド作成
    const thread = await prisma.messageThread.create({
      data: {
        subject: subject || null,
        threadType: threadType || 'inquiry',
        orderId: orderId || null,
        quoteId: quoteId || null,
        memberId: user.role === 'member' ? user.memberId : (memberId || null),
        partnerId: user.role === 'partner' ? user.partnerId : (partnerId || null),
        status: 'open',
      },
    });

    // 最初のメッセージを作成
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        content: message,
        isAdminVisible: true,
      },
    });

    const result = await prisma.messageThread.findUnique({
      where: { id: thread.id },
      include: {
        order: { select: { id: true, orderNumber: true } },
        quote: { select: { id: true, quoteNumber: true } },
        member: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
