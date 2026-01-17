import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['admin']);

    const partners = await prisma.partner.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
            quoteItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const body = await request.json();
    const {
      code,
      name,
      email,
      phone,
      postalCode,
      address,
      bankName,
      bankBranch,
      bankAccountType,
      bankAccountNumber,
      bankAccountName,
      notes,
    } = body;

    // バリデーション
    if (!code || !name || !email) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // コードの重複チェック
    const existingPartner = await prisma.partner.findUnique({
      where: { code },
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: 'このメーカーコードは既に使用されています' },
        { status: 400 }
      );
    }

    const partner = await prisma.partner.create({
      data: {
        code,
        name,
        email,
        phone: phone || null,
        postalCode: postalCode || null,
        address: address || null,
        bankName: bankName || null,
        bankBranch: bankBranch || null,
        bankAccountType: bankAccountType || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountName: bankAccountName || null,
        notes: notes || null,
        isActive: true,
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
