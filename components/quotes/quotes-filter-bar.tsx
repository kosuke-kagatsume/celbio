'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QUOTE_STATUSES } from '@/lib/quote-constants'

interface Props {
  initialStatus: string
}

export function QuotesFilterBar({ initialStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const updateStatus = (value: string) => {
    const params = new URLSearchParams()
    if (value && value !== 'all') params.set('status', value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="mb-4">
      <Select value={initialStatus || 'all'} onValueChange={updateStatus}>
        <SelectTrigger className="min-h-12">
          <SelectValue placeholder="ステータスで絞り込み" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全て</SelectItem>
          {Object.entries(QUOTE_STATUSES).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
