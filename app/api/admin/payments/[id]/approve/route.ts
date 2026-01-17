import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// 入金承認（差異がある場合の承認）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['admin']);
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        bundle: {
          include: {
            bundleInvoices: {
              include: {
                invoice: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: '入金が見つかりません' }, { status: 404 });
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'この入金は承認待ちではありません' },
        { status: 400 }
      );
    }

    // トランザクションで承認処理
    const result = await prisma.$transaction(async (tx) => {
      // 入金を承認済みに
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: user.id,
        },
      });

      // 請求書のステータスを支払済みに
      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        });

        // 正式発注トリガー: 注文のステータスを「正式発注確定」に
        const invoice = await tx.invoice.findUnique({
          where: { id: payment.invoiceId },
          select: { orderId: true },
        });
        if (invoice?.orderId) {
          await tx.order.update({
            where: { id: invoice.orderId },
            data: {
              status: 'confirmed',
              confirmedAt: new Date(),
            },
          });
          // 注文明細も確定済みに
          await tx.orderItem.updateMany({
            where: { orderId: invoice.orderId },
            data: { status: 'confirmed' },
          });
        }
      }

      // おまとめの場合、含まれる全請求書を支払済みに
      if (payment.bundleId && payment.bundle) {
        await tx.invoiceBundle.update({
          where: { id: payment.bundleId },
          data: {
            status: 'paid',
          },
        });

        // おまとめ内の全請求書を支払済みに
        for (const bundleInvoice of payment.bundle.bundleInvoices) {
          const invoice = bundleInvoice.invoice;
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'paid',
              paidAt: new Date(),
            },
          });

          // 正式発注トリガー: 関連する注文を「正式発注確定」に
          if (invoice.orderId) {
            await tx.order.update({
              where: { id: invoice.orderId },
              data: {
                status: 'confirmed',
                confirmedAt: new Date(),
              },
            });
            // 注文明細も確定済みに
            await tx.orderItem.updateMany({
              where: { orderId: invoice.orderId },
              data: { status: 'confirmed' },
            });
          }
        }
      }

      return updatedPayment;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
