import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// 自動マッチング実行
export async function POST() {
  try {
    await requireRole(['admin']);

    // 未マッチの銀行取引を取得
    const unmatchedTxns = await prisma.bankTransaction.findMany({
      where: { matched: false },
      orderBy: { transactionDate: 'desc' },
    });

    // 未払いの請求書を取得
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['issued', 'sent'] },
        payments: { none: {} },
      },
      include: {
        member: { select: { id: true, name: true, payerName: true } },
      },
    });

    // 未払いのおまとめを取得
    const unpaidBundles = await prisma.invoiceBundle.findMany({
      where: {
        status: { in: ['created', 'sent'] },
        payments: { none: {} },
      },
      include: {
        member: { select: { id: true, name: true, payerName: true } },
      },
    });

    const matched: Array<{ txnId: string; invoiceId?: string; bundleId?: string; difference: number }> = [];
    const usedTxnIds = new Set<string>();

    // マッチングロジック
    for (const txn of unmatchedTxns) {
      if (usedTxnIds.has(txn.id)) continue;

      const txnAmount = parseFloat(txn.amount.toString());
      const txnSender = txn.senderName.toLowerCase();
      const txnSenderKana = txn.senderNameKana?.toLowerCase() || '';

      // 1. おまとめとのマッチング（優先）
      for (const bundle of unpaidBundles) {
        const bundleAmount = parseFloat(bundle.totalAmount.toString());
        const memberName = bundle.member.name.toLowerCase();
        const memberBankName = bundle.member.payerName?.toLowerCase() || '';

        // 金額一致 + 名義一致
        if (
          txnAmount === bundleAmount &&
          (txnSender.includes(memberName) ||
            memberName.includes(txnSender) ||
            txnSenderKana.includes(memberBankName) ||
            memberBankName.includes(txnSenderKana))
        ) {
          matched.push({ txnId: txn.id, bundleId: bundle.id, difference: 0 });
          usedTxnIds.add(txn.id);
          break;
        }

        // 金額一致のみ（差異0で名義は緩い一致）
        if (txnAmount === bundleAmount) {
          matched.push({ txnId: txn.id, bundleId: bundle.id, difference: 0 });
          usedTxnIds.add(txn.id);
          break;
        }
      }

      if (usedTxnIds.has(txn.id)) continue;

      // 2. 請求書とのマッチング
      for (const invoice of unpaidInvoices) {
        const invoiceAmount = parseFloat(invoice.totalAmount.toString());
        const memberName = invoice.member.name.toLowerCase();
        const memberBankName = invoice.member.payerName?.toLowerCase() || '';

        // 金額一致 + 名義一致
        if (
          txnAmount === invoiceAmount &&
          (txnSender.includes(memberName) ||
            memberName.includes(txnSender) ||
            txnSenderKana.includes(memberBankName) ||
            memberBankName.includes(txnSenderKana))
        ) {
          matched.push({ txnId: txn.id, invoiceId: invoice.id, difference: 0 });
          usedTxnIds.add(txn.id);
          break;
        }

        // 金額一致のみ
        if (txnAmount === invoiceAmount) {
          matched.push({ txnId: txn.id, invoiceId: invoice.id, difference: 0 });
          usedTxnIds.add(txn.id);
          break;
        }
      }
    }

    // マッチした分をPaymentとして登録
    const createdPayments = [];
    for (const match of matched) {
      const txn = unmatchedTxns.find((t) => t.id === match.txnId);
      if (!txn) continue;

      const payment = await prisma.$transaction(async (tx) => {
        // 入金レコード作成
        const newPayment = await tx.payment.create({
          data: {
            invoiceId: match.invoiceId || null,
            bundleId: match.bundleId || null,
            bankTxnId: match.txnId,
            amount: parseFloat(txn.amount.toString()),
            status: match.difference === 0 ? 'matched' : 'pending',
            matchType: 'auto',
            difference: match.difference !== 0 ? match.difference : null,
          },
        });

        // 銀行取引をマッチ済みに
        await tx.bankTransaction.update({
          where: { id: match.txnId },
          data: { matched: true },
        });

        // 差異がなければ即時承認扱い
        if (match.difference === 0) {
          if (match.invoiceId) {
            await tx.invoice.update({
              where: { id: match.invoiceId },
              data: { status: 'paid', paidAt: new Date() },
            });

            const invoice = await tx.invoice.findUnique({
              where: { id: match.invoiceId },
              select: { orderId: true },
            });
            if (invoice?.orderId) {
              // 正式発注トリガー
              await tx.order.update({
                where: { id: invoice.orderId },
                data: {
                  status: 'confirmed',
                  confirmedAt: new Date(),
                },
              });
              await tx.orderItem.updateMany({
                where: { orderId: invoice.orderId },
                data: { status: 'confirmed' },
              });
            }
          }

          if (match.bundleId) {
            const bundle = await tx.invoiceBundle.findUnique({
              where: { id: match.bundleId },
              include: {
                bundleInvoices: {
                  include: {
                    invoice: true,
                  },
                },
              },
            });

            if (bundle) {
              await tx.invoiceBundle.update({
                where: { id: match.bundleId },
                data: { status: 'paid' },
              });

              for (const bundleInvoice of bundle.bundleInvoices) {
                const inv = bundleInvoice.invoice;
                await tx.invoice.update({
                  where: { id: inv.id },
                  data: { status: 'paid', paidAt: new Date() },
                });

                if (inv.orderId) {
                  // 正式発注トリガー
                  await tx.order.update({
                    where: { id: inv.orderId },
                    data: {
                      status: 'confirmed',
                      confirmedAt: new Date(),
                    },
                  });
                  await tx.orderItem.updateMany({
                    where: { orderId: inv.orderId },
                    data: { status: 'confirmed' },
                  });
                }
              }
            }
          }
        }

        return newPayment;
      });

      createdPayments.push(payment);
    }

    return NextResponse.json({
      message: `${createdPayments.length}件の入金をマッチしました`,
      matched: createdPayments.length,
      total: unmatchedTxns.length,
    });
  } catch (error) {
    console.error('Error auto-matching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
