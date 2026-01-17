import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// ユーザー更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, memberId, partnerId, status } = body;

    // 対象ユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 自分自身のロール変更は禁止
    if (id === user.id && role && role !== user.role) {
      return NextResponse.json(
        { error: '自分自身のロールは変更できません' },
        { status: 400 }
      );
    }

    // ロールに応じた所属チェック
    const updateRole = role || targetUser.role;
    if (updateRole === 'member' && memberId === null) {
      return NextResponse.json(
        { error: '加盟店ユーザーには加盟店の指定が必要です' },
        { status: 400 }
      );
    }

    if (updateRole === 'partner' && partnerId === null) {
      return NextResponse.json(
        { error: 'メーカーユーザーにはメーカーの指定が必要です' },
        { status: 400 }
      );
    }

    const oldValue = {
      name: targetUser.name,
      role: targetUser.role,
      memberId: targetUser.memberId,
      partnerId: targetUser.partnerId,
      status: targetUser.status,
    };

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : targetUser.name,
        role: role !== undefined ? role : targetUser.role,
        memberId: role === 'member' ? memberId : (role === 'admin' ? null : targetUser.memberId),
        partnerId: role === 'partner' ? partnerId : (role === 'admin' ? null : targetUser.partnerId),
        status: status !== undefined ? status : targetUser.status,
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
        action: 'update',
        entityType: 'user',
        entityId: id,
        oldValue,
        newValue: {
          name: updatedUser.name,
          role: updatedUser.role,
          memberId: updatedUser.memberId,
          partnerId: updatedUser.partnerId,
          status: updatedUser.status,
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ユーザー削除（論理削除 - ステータスをinactiveに）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 自分自身は削除できない
    if (id === user.id) {
      return NextResponse.json(
        { error: '自分自身は削除できません' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 論理削除
    await prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'delete',
        entityType: 'user',
        entityId: id,
        oldValue: { status: targetUser.status },
        newValue: { status: 'inactive' },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
