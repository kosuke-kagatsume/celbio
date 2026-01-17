import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['admin']);

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
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
    const { code, name, description, sortOrder } = body;

    // バリデーション
    if (!code || !name) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // コードの重複チェック
    const existingCategory = await prisma.category.findUnique({
      where: { code },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'このカテゴリコードは既に使用されています' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        code,
        name,
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
