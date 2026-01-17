import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          member: { select: { id: true, name: true, code: true } },
          partner: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // 統計情報
    const [adminCount, activeCount] = await Promise.all([
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      users,
      stats: {
        total,
        admin: adminCount,
        active: activeCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ユーザー作成
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, role, memberId, partnerId, status } = body;

    // バリデーション
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // ロールに応じた所属チェック
    if (role === 'member' && !memberId) {
      return NextResponse.json(
        { error: '加盟店ユーザーには加盟店の指定が必要です' },
        { status: 400 }
      );
    }

    if (role === 'partner' && !partnerId) {
      return NextResponse.json(
        { error: 'メーカーユーザーにはメーカーの指定が必要です' },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        memberId: role === 'member' ? memberId : null,
        partnerId: role === 'partner' ? partnerId : null,
        status: status || 'active',
      },
      include: {
        member: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true, code: true } },
      },
    });

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'create',
        entityType: 'user',
        entityId: newUser.id,
        newValue: { email, name, role, status: newUser.status },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
