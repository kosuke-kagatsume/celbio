import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 銀行口座情報取得
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

    const bankAccount = await prisma.onboardingBankAccount.findFirst({
      where: { applicationId: id },
    });

    if (!bankAccount) {
      return NextResponse.json({ error: '銀行口座情報が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 銀行口座情報作成・更新
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
      fullName,
      applicationType,
      consent,
      bankName,
      bankCode,
      branchName,
      branchCode,
      accountNumber,
      accountHolderKana,
      status,
    } = body;

    // 既存レコードを検索
    const existing = await prisma.onboardingBankAccount.findFirst({
      where: { applicationId: id },
    });

    const dataToSave = {
      email,
      employeeNumber,
      fullName,
      applicationType,
      consent: consent ?? false,
      bankName,
      bankCode,
      branchName,
      branchCode,
      accountNumber,
      accountHolderKana,
      savedAt: new Date(),
      status: status || 'draft',
      submittedAt: status === 'submitted' ? new Date() : existing?.submittedAt,
    };

    let bankAccount;
    if (existing) {
      bankAccount = await prisma.onboardingBankAccount.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    } else {
      bankAccount = await prisma.onboardingBankAccount.create({
        data: {
          ...dataToSave,
          applicationId: id,
          tenantId: application.tenantId,
        },
      });
    }

    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error('Error saving bank account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 銀行口座情報部分更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.onboardingBankAccount.findFirst({
      where: { applicationId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: '銀行口座情報が見つかりません' }, { status: 404 });
    }

    const bankAccount = await prisma.onboardingBankAccount.update({
      where: { id: existing.id },
      data: {
        ...body,
        savedAt: new Date(),
      },
    });

    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
