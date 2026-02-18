import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 家族情報取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const familyInfo = await prisma.onboardingFamilyInfo.findFirst({
      where: { applicationId: id },
    });

    if (!familyInfo) {
      return NextResponse.json({ error: '家族情報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(familyInfo);
  } catch (error) {
    console.error('Error fetching family info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 家族情報作成・更新
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // アプリケーションの存在確認
    const application = await prisma.onboardingApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    const {
      email,
      employeeNumber,
      lastNameKanji,
      firstNameKanji,
      hasSpouse,
      spouse,
      familyMembers,
      status,
    } = body;

    // 既存レコードを検索
    const existing = await prisma.onboardingFamilyInfo.findFirst({
      where: { applicationId: id },
    });

    const dataToSave = {
      email,
      employeeNumber,
      lastNameKanji,
      firstNameKanji,
      hasSpouse: hasSpouse ?? false,
      spouse,
      familyMembers,
      savedAt: new Date(),
      status: status || 'draft',
      submittedAt: status === 'submitted' ? new Date() : existing?.submittedAt,
    };

    let familyInfo;
    if (existing) {
      familyInfo = await prisma.onboardingFamilyInfo.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    } else {
      familyInfo = await prisma.onboardingFamilyInfo.create({
        data: {
          ...dataToSave,
          applicationId: id,
          tenantId: application.tenantId,
        },
      });
    }

    return NextResponse.json(familyInfo);
  } catch (error) {
    console.error('Error saving family info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 家族情報部分更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.onboardingFamilyInfo.findFirst({
      where: { applicationId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: '家族情報が見つかりません' }, { status: 404 });
    }

    const familyInfo = await prisma.onboardingFamilyInfo.update({
      where: { id: existing.id },
      data: {
        ...body,
        savedAt: new Date(),
      },
    });

    return NextResponse.json(familyInfo);
  } catch (error) {
    console.error('Error updating family info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
