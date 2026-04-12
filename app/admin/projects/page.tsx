'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProjectList } from '@/components/projects/project-list'
import { Search, Loader2 } from 'lucide-react'
import { PROJECT_STATUSES } from '@/lib/projects'

interface ProjectItem {
  id: string
  projectNumber: string
  clientName: string
  address: string | null
  status: string
  createdAt: string
  member: { id: string; name: string }
  _count: { quotes: number; orders: number; files: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchProjects()
  }, [status, page])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/projects?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects)
        setPagination(data.pagination)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchProjects()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">案件管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          全加盟店の案件一覧 {pagination ? `(${pagination.total}件)` : ''}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            placeholder="施主名・住所・案件番号で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="min-h-12"
          />
        </div>
        <Button variant="outline" className="min-h-12" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="mb-4">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <ProjectList projects={projects} basePath="/admin/projects" showMember />
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>前へ</Button>
          <span className="flex items-center text-sm text-gray-500">{page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>次へ</Button>
        </div>
      )}
    </div>
  )
}
