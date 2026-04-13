import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    const isActiveParam = searchParams.get('isActive');
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }
    const partnerId = searchParams.get('partnerId');
    if (partnerId) {
      where.partnerId = partnerId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true, code: true, name: true, unit: true, unitPrice: true,
          productType: true, isActive: true, createdAt: true,
          category: { select: { id: true, name: true, code: true } },
          partner: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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
      categoryId,
      partnerId,
      productType,
      unit,
      unitPrice,
      description,
      specifications,
    } = body;

    // バリデーション
    if (!code || !name || !categoryId || !partnerId || !productType) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    // コードの重複チェック
    const existingProduct = await prisma.product.findUnique({
      where: { code },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'この商材コードは既に使用されています' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        categoryId,
        partnerId,
        productType,
        unit: unit || null,
        unitPrice: unitPrice || null,
        description: description || null,
        specifications: specifications ? JSON.parse(specifications) : null,
        isActive: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
