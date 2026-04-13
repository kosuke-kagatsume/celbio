// 通知システム — ビジネスイベント発生時の通知作成

import { prisma } from '@/lib/prisma'

// ============================================
// 型定義
// ============================================

export type NotificationType =
  | 'quote_requested'
  | 'quote_answered'
  | 'order_created'
  | 'order_status_changed'
  | 'invoice_issued'
  | 'payment_received'
  | 'bank_transaction_synced'
  | 'message_received'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message?: string
  linkUrl?: string
}

// ============================================
// 低レベルヘルパー
// ============================================

/** 単一通知作成 */
async function createNotification(params: CreateNotificationParams): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message || null,
      linkUrl: params.linkUrl || null,
    },
  })
}

/** 複数ユーザーに同じ通知を一括作成 */
async function createNotificationsForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  if (userIds.length === 0) return
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message || null,
      linkUrl: params.linkUrl || null,
    })),
  })
}

// ============================================
// ユーザー解決ヘルパー
// ============================================

async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  })
  return admins.map((u) => u.id)
}

async function getUserIdsForMember(memberId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { memberId },
    select: { id: true },
  })
  return users.map((u) => u.id)
}

async function getUserIdsForPartner(partnerId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { partnerId },
    select: { id: true },
  })
  return users.map((u) => u.id)
}

// ============================================
// fire-and-forget ラッパー
// ============================================

function fireAndForget(fn: () => Promise<void>): void {
  fn().catch((err) => console.error('[Notification Error]', err))
}

// ============================================
// イベント別トリガー関数
// ============================================

/** 見積依頼が作成された → admin + partner */
export function notifyQuoteRequested(quoteId: string): void {
  fireAndForget(async () => {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { quoteNumber: true, title: true, items: { select: { partnerId: true } } },
    })
    if (!quote) return

    const adminIds = await getAdminUserIds()
    const partnerIds = [...new Set(quote.items.map((i) => i.partnerId).filter(Boolean))] as string[]
    const partnerUserIds = (await Promise.all(partnerIds.map(getUserIdsForPartner))).flat()

    const title = `見積依頼: ${quote.title || quote.quoteNumber}`
    await createNotificationsForUsers(adminIds, { type: 'quote_requested', title, linkUrl: `/admin/quotes` })
    await createNotificationsForUsers(partnerUserIds, { type: 'quote_requested', title, linkUrl: `/partner/quotes` })
  })
}

/** 見積回答が来た → admin + member */
export function notifyQuoteAnswered(quoteId: string): void {
  fireAndForget(async () => {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { quoteNumber: true, title: true, memberId: true },
    })
    if (!quote) return

    const adminIds = await getAdminUserIds()
    const memberUserIds = await getUserIdsForMember(quote.memberId)

    const title = `見積回答: ${quote.title || quote.quoteNumber}`
    await createNotificationsForUsers(adminIds, { type: 'quote_answered', title, linkUrl: `/admin/quotes` })
    await createNotificationsForUsers(memberUserIds, { type: 'quote_answered', title, linkUrl: `/member/quotes` })
  })
}

/** 発注が作成された → admin + 関連partner */
export function notifyOrderCreated(orderId: string): void {
  fireAndForget(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, items: { select: { partnerId: true } } },
    })
    if (!order) return

    const adminIds = await getAdminUserIds()
    const partnerIds = [...new Set(order.items.map((i) => i.partnerId).filter(Boolean))] as string[]
    const partnerUserIds = (await Promise.all(partnerIds.map(getUserIdsForPartner))).flat()

    const title = `新規発注: ${order.orderNumber}`
    await createNotificationsForUsers(adminIds, { type: 'order_created', title, linkUrl: `/admin/orders` })
    await createNotificationsForUsers(partnerUserIds, { type: 'order_created', title, linkUrl: `/partner/orders` })
  })
}

/** 発注ステータス変更 → member */
export function notifyOrderStatusChanged(orderId: string, newStatus: string): void {
  fireAndForget(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, memberId: true },
    })
    if (!order) return

    const statusLabels: Record<string, string> = {
      ordered: '発注確定', confirmed: '受注確認', shipped: '出荷済み',
      delivered: '納品完了', completed: '完了',
    }
    const label = statusLabels[newStatus] || newStatus
    const memberUserIds = await getUserIdsForMember(order.memberId)

    await createNotificationsForUsers(memberUserIds, {
      type: 'order_status_changed',
      title: `発注 ${order.orderNumber}: ${label}`,
      linkUrl: `/member/orders`,
    })
  })
}

/** 請求書発行 → member */
export function notifyInvoiceIssued(invoiceId: string): void {
  fireAndForget(async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { invoiceNumber: true, memberId: true },
    })
    if (!invoice) return

    const memberUserIds = await getUserIdsForMember(invoice.memberId)
    await createNotificationsForUsers(memberUserIds, {
      type: 'invoice_issued',
      title: `請求書発行: ${invoice.invoiceNumber}`,
      linkUrl: `/member/invoices`,
    })
  })
}

/** 入金確認 → admin + member */
export function notifyPaymentReceived(orderId: string, memberName: string): void {
  fireAndForget(async () => {
    const adminIds = await getAdminUserIds()
    await createNotificationsForUsers(adminIds, {
      type: 'payment_received',
      title: `入金確認: ${memberName}`,
      linkUrl: `/admin/payments`,
    })
  })
}

/** 銀行取引同期完了 → admin */
export function notifyBankTransactionSynced(count: number): void {
  fireAndForget(async () => {
    const adminIds = await getAdminUserIds()
    await createNotificationsForUsers(adminIds, {
      type: 'bank_transaction_synced',
      title: `銀行取引 ${count}件を同期しました`,
      linkUrl: `/admin/bank-transactions`,
    })
  })
}

/** メッセージ受信 → スレッド参加者（送信者以外） */
export function notifyMessageReceived(threadId: string, senderId: string): void {
  fireAndForget(async () => {
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      select: { subject: true, memberId: true, partnerId: true },
    })
    if (!thread) return

    // スレッド参加者: admin全員 + member + partner のユーザー
    const adminIds = await getAdminUserIds()
    const memberUserIds = thread.memberId ? await getUserIdsForMember(thread.memberId) : []
    const partnerUserIds = thread.partnerId ? await getUserIdsForPartner(thread.partnerId) : []

    const allUserIds = [...adminIds, ...memberUserIds, ...partnerUserIds]
      .filter((id) => id !== senderId) // 送信者を除外

    const title = `新しいメッセージ: ${thread.subject || '問い合わせ'}`
    // ロールごとに異なるlinkUrlが必要だが、fire-and-forgetなのでシンプルに
    // 各ユーザーのロールを取得して振り分ける
    const users = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true, role: true },
    })

    const rolePrefix: Record<string, string> = {
      admin: '/admin', member: '/member', partner: '/partner', electrician: '/electrician',
    }

    for (const user of users) {
      const prefix = rolePrefix[user.role] || '/admin'
      await createNotification({
        userId: user.id,
        type: 'message_received',
        title,
        linkUrl: `${prefix}/messages/${threadId}`,
      })
    }
  })
}
