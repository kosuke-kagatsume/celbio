'use client'

import { MessageList } from '@/components/messages/message-list'

export default function AdminMessagesPage() {
  return <MessageList rolePrefix="/admin" />
}
