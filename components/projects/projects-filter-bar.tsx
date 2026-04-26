'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { PROJECT_STATUSES } from '@/lib/project-constants'

interface Props {
  initialSearch: string
  initialStatus: string
}

export function ProjectsFilterBar({ initialSearch, initialStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(initialSearch)

  const updateUrl = (next: { search?: string; status?: string }) => {
    const params = new URLSearchParams()
    const newSearch = next.search ?? search
    const newStatus = next.status ?? initialStatus
    if (newSearch) params.set('search', newSearch)
    if (newStatus) params.set('status', newStatus)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            placeholder="施主名・住所で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateUrl({ search })}
            className="min-h-12"
          />
        </div>
        <Button variant="outline" className="min-h-12" onClick={() => updateUrl({ search })}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="mb-4">
        <Select
          value={initialStatus || 'all'}
          onValueChange={(v) => updateUrl({ status: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="min-h-12">
            <SelectValue placeholder="ステータスで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            {Object.entries(PROJECT_STATUSES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
