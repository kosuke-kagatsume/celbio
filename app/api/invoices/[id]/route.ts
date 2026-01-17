import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 請求書詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            deliveryAddress: true,
            orderedAt: true,
            items: {
              include: {
                partner: { select: { id: true, name: true } },
                product: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            bankName: true,
            bankBranch: true,
            bankAccountType: true,
            bankAccountNumber: true,
            bankAccountName: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: '請求書が見つかりません' }, { status: 404 });
    }

    // アクセス権チェック
    if (user.role === 'member' && invoice.memberId !== user.memberId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }
    if (user.role === 'partner' && invoice.partnerId !== user.partnerId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 請求書更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: '請求書が見つかりません' }, { status: 404 });
    }

    // メーカーは自社の請求書のみ更新可能
    if (user.role === 'partner' && invoice.partnerId !== user.partnerId) {
      return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
    }

    const { status, dueDate, pdfUrl } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;

    // ステータスが支払済みに変更された場合
    if (status === 'paid') {
      updateData.paidAt = new Date();
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        order: { select: { id: true, orderNumber: true } },
        partner: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
