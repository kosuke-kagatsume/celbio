'use client'

import { use } from 'react'
import { MessageDetailPage } from '@/components/messages/message-detail-page'

export default function PartnerMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <MessageDetailPage threadId={id} backUrl="/partner/messages" />
}
