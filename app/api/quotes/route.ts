import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 見積一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // ロールに応じたフィルター
    const whereClause: Record<string, unknown> = {};

    if (user.role === 'member') {
      whereClause.memberId = user.memberId;
    } else if (user.role === 'partner') {
      // メーカーの場合、自社が関係する見積のみ
      whereClause.items = {
        some: { partnerId: user.partnerId }
      };
    }
    // adminは全件取得可能

    if (status) {
      whereClause.status = status;
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: whereClause,
        include: {
          member: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              partner: { select: { id: true, name: true } },
            },
          },
          _count: { select: { files: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 見積作成
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 加盟店ユーザーのみ作成可能
    if (user.role !== 'member' || !user.memberId) {
      return NextResponse.json(
        { error: '加盟店ユーザーのみ見積を作成できます' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryId, title, description, deliveryAddress, desiredDate, items } = body;

    // バリデーション
    if (!categoryId || !title || !items || items.length === 0) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // 見積番号生成
    const today = new Date();
    const datePrefix = `Q${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayQuotesCount = await prisma.quote.count({
      where: {
        quoteNumber: { startsWith: datePrefix },
      },
    });
    const quoteNumber = `${datePrefix}-${String(todayQuotesCount + 1).padStart(4, '0')}`;

    // トランザクションで見積と明細を作成
    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.quote.create({
        data: {
          quoteNumber,
          memberId: user.memberId!,
          userId: user.id,
          categoryId,
          status: 'draft',
          title,
          description,
          deliveryAddress,
          desiredDate: desiredDate ? new Date(desiredDate) : null,
        },
      });

      // 明細の作成
      for (const item of items) {
        await tx.quoteItem.create({
          data: {
            quoteId: newQuote.id,
            partnerId: item.partnerId,
            productId: item.productId || null,
            itemName: item.itemName,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            status: 'pending',
          },
        });
      }

      return newQuote;
    });

    // 作成した見積を取得
    const createdQuote = await prisma.quote.findUnique({
      where: { id: quote.id },
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

    return NextResponse.json(createdQuote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
