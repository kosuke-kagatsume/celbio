'use client'

import { cn } from '@/lib/utils'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/orders'

const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

interface OrderStatusBadgeProps {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const label = ORDER_STATUSES[status as OrderStatus] ?? status
  const color = STATUS_COLORS[status as OrderStatus] ?? 'bg-gray-100 text-gray-700'

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', color, className)}>
      {label}
    </span>
  )
}
