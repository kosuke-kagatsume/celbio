import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// 入金履歴取得（加盟店・メーカー向け）
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // 期間フィルター
    let dateFilter = {};
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = { createdAt: { gte: startDate, lte: endDate } };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      dateFilter = { createdAt: { gte: startDate, lte: endDate } };
    }

    if (user.role === 'member') {
      // 加盟店: 自分の支払い履歴
      if (!user.memberId) {
        return NextResponse.json({ error: 'Member ID not found' }, { status: 403 });
      }
      const memberId = user.memberId;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: {
            status: { in: ['matched', 'approved'] },
            OR: [
              { invoice: { memberId } },
              { bundle: { memberId } },
            ],
            ...dateFilter,
          },
          include: {
            invoice: {
              include: {
                partner: { select: { id: true, name: true } },
                order: { select: { id: true, orderNumber: true } },
              },
            },
            bundle: {
              include: {
                bundleInvoices: {
                  include: {
                    invoice: {
                      select: { id: true, invoiceNumber: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.payment.count({
          where: {
            status: { in: ['matched', 'approved'] },
            OR: [
              { invoice: { memberId } },
              { bundle: { memberId } },
            ],
            ...dateFilter,
          },
        }),
      ]);

      // 月次サマリー
      const totalAmount = payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      );

      return NextResponse.json({
        payments,
        summary: { totalAmount, count: total },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else if (user.role === 'partner') {
      // メーカー: 自分への入金履歴
      if (!user.partnerId) {
        return NextResponse.json({ error: 'Partner ID not found' }, { status: 403 });
      }
      const partnerId = user.partnerId;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: {
            status: { in: ['matched', 'approved'] },
            invoice: { partnerId },
            ...dateFilter,
          },
          include: {
            invoice: {
              include: {
                member: { select: { id: true, name: true } },
                order: { select: { id: true, orderNumber: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.payment.count({
          where: {
            status: { in: ['matched', 'approved'] },
            invoice: { partnerId },
            ...dateFilter,
          },
        }),
      ]);

      const totalAmount = payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      );

      return NextResponse.json({
        payments,
        summary: { totalAmount, count: total },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
