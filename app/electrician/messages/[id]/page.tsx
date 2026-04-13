'use client'

import { use } from 'react'
import { MessageDetailPage } from '@/components/messages/message-detail-page'

export default function ElectricianMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <MessageDetailPage threadId={id} backUrl="/electrician/messages" />
}
