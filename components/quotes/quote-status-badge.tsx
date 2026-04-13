'use client'

import { cn } from '@/lib/utils'
import { QUOTE_STATUSES, type QuoteStatus } from '@/lib/quote-constants'

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  requested: 'bg-blue-100 text-blue-700',
  responded: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

interface QuoteStatusBadgeProps {
  status: string
  className?: string
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const label = QUOTE_STATUSES[status as QuoteStatus] ?? status
  const color = STATUS_COLORS[status as QuoteStatus] ?? 'bg-gray-100 text-gray-700'

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', color, className)}>
      {label}
    </span>
  )
}
