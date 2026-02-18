import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 入社申請詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみアクセス可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.onboardingApplication.findUnique({
      where: { id },
      include: {
        basicInfo: true,
        familyInfo: true,
        bankAccount: true,
        commuteRoute: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching onboarding application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 入社申請更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみ更新可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const application = await prisma.onboardingApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    const {
      applicantEmail,
      applicantName,
      hireDate,
      deadline,
      department,
      position,
      hrNotes,
      employeeId,
    } = body;

    const updatedApplication = await prisma.onboardingApplication.update({
      where: { id },
      data: {
        applicantEmail: applicantEmail !== undefined ? applicantEmail : application.applicantEmail,
        applicantName: applicantName !== undefined ? applicantName : application.applicantName,
        hireDate: hireDate !== undefined ? new Date(hireDate) : application.hireDate,
        deadline: deadline !== undefined ? new Date(deadline) : application.deadline,
        department: department !== undefined ? department : application.department,
        position: position !== undefined ? position : application.position,
        hrNotes: hrNotes !== undefined ? hrNotes : application.hrNotes,
        employeeId: employeeId !== undefined ? employeeId : application.employeeId,
      },
      include: {
        basicInfo: true,
        familyInfo: true,
        bankAccount: true,
        commuteRoute: true,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating onboarding application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 入社申請削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみ削除可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.onboardingApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    // カスケード削除により関連フォームも削除される
    await prisma.onboardingApplication.delete({ where: { id } });

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    console.error('Error deleting onboarding application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
