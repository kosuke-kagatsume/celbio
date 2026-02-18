import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 家族情報承認
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみ承認可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const familyInfo = await prisma.onboardingFamilyInfo.findFirst({
      where: { applicationId: id },
    });

    if (!familyInfo) {
      return NextResponse.json({ error: '家族情報が見つかりません' }, { status: 404 });
    }

    // 提出済みでないと承認できない
    if (familyInfo.status !== 'submitted') {
      return NextResponse.json(
        { error: '提出済みの情報のみ承認できます' },
        { status: 400 }
      );
    }

    const updatedFamilyInfo = await prisma.onboardingFamilyInfo.update({
      where: { id: familyInfo.id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.id,
      },
    });

    return NextResponse.json(updatedFamilyInfo);
  } catch (error) {
    console.error('Error approving family info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
