import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['admin']);

    const products = await prisma.product.findMany({
      include: {
        category: true,
        partner: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
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
