'use client';

import { useEffect, useState, use } from 'react';
import { MessageThread } from '@/components/messages/message-thread';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  files: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
}

interface Thread {
  id: string;
  subject: string | null;
  threadType: string;
  status: string;
  createdAt: string;
  order: { id: string; orderNumber: string } | null;
  quote: { id: string; quoteNumber: string } | null;
  member: { id: string; name: string } | null;
  partner: { id: string; name: string } | null;
  messages: Message[];
}

export default function MemberMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [thread, setThread] = useState<Thread | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchThread();
    fetchCurrentUser();
  }, [id]);

  const fetchThread = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages/${id}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        スレッドが見つかりません
      </div>
    );
  }

  return (
    <MessageThread
      thread={thread}
      currentUserId={currentUserId}
      backUrl="/member/messages"
      onRefresh={fetchThread}
    />
  );
}
