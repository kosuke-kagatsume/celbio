import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 基本情報取得
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

    const basicInfo = await prisma.onboardingBasicInfo.findFirst({
      where: { applicationId: id },
    });

    if (!basicInfo) {
      return NextResponse.json({ error: '基本情報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(basicInfo);
  } catch (error) {
    console.error('Error fetching basic info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 基本情報作成・更新
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
      lastNameKanji,
      firstNameKanji,
      lastNameKana,
      firstNameKana,
      email,
      hireDate,
      birthDate,
      gender,
      phoneNumber,
      personalEmail,
      currentAddress,
      residentAddress,
      emergencyContact,
      socialInsurance,
      myNumberEncrypted,
      myNumberSubmitted,
      documents,
      status,
    } = body;

    // 既存レコードを検索
    const existing = await prisma.onboardingBasicInfo.findFirst({
      where: { applicationId: id },
    });

    const dataToSave = {
      lastNameKanji,
      firstNameKanji,
      lastNameKana,
      firstNameKana,
      email,
      hireDate: hireDate ? new Date(hireDate) : null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender,
      phoneNumber,
      personalEmail,
      currentAddress,
      residentAddress,
      emergencyContact,
      socialInsurance,
      myNumberEncrypted,
      myNumberSubmitted: myNumberSubmitted ?? false,
      documents,
      savedAt: new Date(),
      status: status || 'draft',
      submittedAt: status === 'submitted' ? new Date() : existing?.submittedAt,
    };

    let basicInfo;
    if (existing) {
      basicInfo = await prisma.onboardingBasicInfo.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    } else {
      basicInfo = await prisma.onboardingBasicInfo.create({
        data: {
          ...dataToSave,
          applicationId: id,
          tenantId: application.tenantId,
        },
      });
    }

    return NextResponse.json(basicInfo);
  } catch (error) {
    console.error('Error saving basic info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 基本情報部分更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.onboardingBasicInfo.findFirst({
      where: { applicationId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: '基本情報が見つかりません' }, { status: 404 });
    }

    const basicInfo = await prisma.onboardingBasicInfo.update({
      where: { id: existing.id },
      data: {
        ...body,
        savedAt: new Date(),
      },
    });

    return NextResponse.json(basicInfo);
  } catch (error) {
    console.error('Error updating basic info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
