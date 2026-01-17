import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['admin']);

    const members = await prisma.member.findMany({
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
            quotes: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
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
    const { code, name, email, phone, postalCode, address, payerName, notes } = body;

    // バリデーション
    if (!code || !name || !email) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // コードの重複チェック
    const existingMember = await prisma.member.findUnique({
      where: { code },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'この加盟店コードは既に使用されています' },
        { status: 400 }
      );
    }

    const member = await prisma.member.create({
      data: {
        code,
        name,
        email,
        phone: phone || null,
        postalCode: postalCode || null,
        address: address || null,
        payerName: payerName || null,
        notes: notes || null,
        isActive: true,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
