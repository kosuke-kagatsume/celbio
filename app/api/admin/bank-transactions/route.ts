import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// 銀行取引一覧取得
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const matched = searchParams.get('matched');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};
    if (matched !== null) {
      whereClause.matched = matched === 'true';
    }

    const [transactions, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: whereClause,
        include: {
          payments: {
            include: {
              invoice: {
                select: { id: true, invoiceNumber: true },
              },
              bundle: {
                select: { id: true, bundleNumber: true },
              },
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bankTransaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 銀行取引データインポート（CSV等から）
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const body = await request.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: '取引データが必要です' },
        { status: 400 }
      );
    }

    const created = [];
    const skipped = [];

    for (const txn of transactions) {
      // 重複チェック（日付+金額+振込人名義）
      const existing = await prisma.bankTransaction.findFirst({
        where: {
          transactionDate: new Date(txn.transactionDate),
          amount: parseFloat(txn.amount),
          senderName: txn.senderName,
        },
      });

      if (existing) {
        skipped.push(txn);
        continue;
      }

      const newTxn = await prisma.bankTransaction.create({
        data: {
          transactionDate: new Date(txn.transactionDate),
          senderName: txn.senderName,
          senderNameKana: txn.senderNameKana || null,
          amount: parseFloat(txn.amount),
          balance: txn.balance ? parseFloat(txn.balance) : null,
          description: txn.description || null,
          matched: false,
        },
      });
      created.push(newTxn);
    }

    return NextResponse.json({
      message: `${created.length}件インポート、${skipped.length}件スキップ（重複）`,
      created: created.length,
      skipped: skipped.length,
    });
  } catch (error) {
    console.error('Error importing bank transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
