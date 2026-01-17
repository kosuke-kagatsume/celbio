import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 請求書おまとめ一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'member' || !user.memberId) {
      return NextResponse.json(
        { error: '加盟店ユーザーのみアクセスできます' },
        { status: 403 }
      );
    }

    const bundles = await prisma.invoiceBundle.findMany({
      where: { memberId: user.memberId },
      include: {
        bundleInvoices: {
          include: {
            invoice: {
              include: {
                partner: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bundles);
  } catch (error) {
    console.error('Error fetching invoice bundles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 請求書おまとめ作成
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'member' || !user.memberId) {
      return NextResponse.json(
        { error: '加盟店ユーザーのみおまとめを作成できます' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invoiceIds } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: '請求書を選択してください' },
        { status: 400 }
      );
    }

    // 請求書を取得
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        memberId: user.memberId,
        status: { in: ['issued', 'sent'] }, // 未払いの請求書のみ
      },
    });

    if (invoices.length !== invoiceIds.length) {
      return NextResponse.json(
        { error: '一部の請求書が見つからないか、既に支払済みです' },
        { status: 400 }
      );
    }

    // 既におまとめに含まれている請求書がないかチェック
    const existingBundleInvoices = await prisma.bundleInvoice.findMany({
      where: { invoiceId: { in: invoiceIds } },
    });

    if (existingBundleInvoices.length > 0) {
      return NextResponse.json(
        { error: '一部の請求書は既におまとめに含まれています' },
        { status: 400 }
      );
    }

    // 合計金額を計算
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount.toString()),
      0
    );

    // おまとめ番号生成
    const today = new Date();
    const datePrefix = `BDL${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const monthBundlesCount = await prisma.invoiceBundle.count({
      where: { bundleNumber: { startsWith: datePrefix } },
    });
    const bundleNumber = `${datePrefix}-${String(monthBundlesCount + 1).padStart(4, '0')}`;

    // おまとめ作成
    const bundle = await prisma.$transaction(async (tx) => {
      const newBundle = await tx.invoiceBundle.create({
        data: {
          bundleNumber,
          memberId: user.memberId!,
          userId: user.id,
          totalAmount,
          status: 'created',
        },
      });

      // 請求書との紐付け
      for (const invoiceId of invoiceIds) {
        await tx.bundleInvoice.create({
          data: {
            bundleId: newBundle.id,
            invoiceId,
          },
        });
      }

      return newBundle;
    });

    const createdBundle = await prisma.invoiceBundle.findUnique({
      where: { id: bundle.id },
      include: {
        bundleInvoices: {
          include: {
            invoice: {
              include: {
                partner: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(createdBundle, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice bundle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
