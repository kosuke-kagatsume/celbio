import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { randomBytes } from 'crypto';

// アクセストークン生成（48文字のURLセーフ文字列）
function generateAccessToken(): string {
  return randomBytes(36).toString('base64url');
}

// 入社申請一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみアクセス可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    // テナントIDでフィルタリング（将来的なマルチテナント対応）
    // 現時点ではデフォルトテナントを使用
    whereClause.tenantId = 'default';

    if (status) {
      whereClause.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.onboardingApplication.findMany({
        where: whereClause,
        include: {
          basicInfo: {
            select: {
              id: true,
              status: true,
              lastNameKanji: true,
              firstNameKanji: true,
            },
          },
          familyInfo: {
            select: {
              id: true,
              status: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              status: true,
            },
          },
          commuteRoute: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.onboardingApplication.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching onboarding applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 入社申請作成
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者のみ作成可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      applicantEmail,
      applicantName,
      hireDate,
      deadline,
      department,
      position,
      hrNotes,
    } = body;

    // バリデーション
    if (!applicantEmail || !applicantName || !hireDate || !deadline) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    const tenantId = 'default';
    const accessToken = generateAccessToken();

    // トランザクションで申請と各フォームを作成
    const application = await prisma.$transaction(async (tx) => {
      const newApplication = await tx.onboardingApplication.create({
        data: {
          tenantId,
          applicantEmail,
          applicantName,
          hireDate: new Date(hireDate),
          deadline: new Date(deadline),
          department,
          position,
          hrNotes,
          accessToken,
          status: 'draft',
        },
      });

      // 各フォームを初期作成
      await Promise.all([
        tx.onboardingBasicInfo.create({
          data: {
            applicationId: newApplication.id,
            tenantId,
            email: applicantEmail,
            hireDate: new Date(hireDate),
          },
        }),
        tx.onboardingFamilyInfo.create({
          data: {
            applicationId: newApplication.id,
            tenantId,
            email: applicantEmail,
          },
        }),
        tx.onboardingBankAccount.create({
          data: {
            applicationId: newApplication.id,
            tenantId,
            email: applicantEmail,
            fullName: applicantName,
          },
        }),
        tx.onboardingCommuteRoute.create({
          data: {
            applicationId: newApplication.id,
            tenantId,
            name: applicantName,
          },
        }),
      ]);

      return newApplication;
    });

    // 作成した申請を取得
    const createdApplication = await prisma.onboardingApplication.findUnique({
      where: { id: application.id },
      include: {
        basicInfo: true,
        familyInfo: true,
        bankAccount: true,
        commuteRoute: true,
      },
    });

    return NextResponse.json(createdApplication, { status: 201 });
  } catch (error) {
    console.error('Error creating onboarding application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
