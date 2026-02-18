import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const VALID_STATUSES = ['draft', 'submitted', 'returned', 'approved', 'registered'];

// ステータス変更
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみ変更可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      );
    }

    const application = await prisma.onboardingApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };

    // 承認時はタイムスタンプと承認者を記録
    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = user.id;
    }

    // 提出時はタイムスタンプを記録
    if (status === 'submitted') {
      updateData.submittedAt = new Date();
    }

    const updatedApplication = await prisma.onboardingApplication.update({
      where: { id },
      data: updateData,
      include: {
        basicInfo: true,
        familyInfo: true,
        bankAccount: true,
        commuteRoute: true,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
