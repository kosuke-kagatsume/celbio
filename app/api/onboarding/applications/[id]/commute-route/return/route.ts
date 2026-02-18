import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 通勤経路情報差戻し
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみ差戻し可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reviewComment } = body;

    const commuteRoute = await prisma.onboardingCommuteRoute.findFirst({
      where: { applicationId: id },
    });

    if (!commuteRoute) {
      return NextResponse.json({ error: '通勤経路情報が見つかりません' }, { status: 404 });
    }

    // 提出済みでないと差戻しできない
    if (commuteRoute.status !== 'submitted') {
      return NextResponse.json(
        { error: '提出済みの情報のみ差戻しできます' },
        { status: 400 }
      );
    }

    const updatedCommuteRoute = await prisma.onboardingCommuteRoute.update({
      where: { id: commuteRoute.id },
      data: {
        status: 'returned',
        returnedAt: new Date(),
        reviewComment: reviewComment || null,
      },
    });

    return NextResponse.json(updatedCommuteRoute);
  } catch (error) {
    console.error('Error returning commute route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
