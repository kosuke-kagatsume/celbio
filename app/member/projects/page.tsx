import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { listProjectsForUser } from '@/lib/projects/list-projects'
import { ProjectList } from '@/components/projects/project-list'
import { ProjectsFilterBar } from '@/components/projects/projects-filter-bar'
import { ListPagination } from '@/components/common/list-pagination'
import { Button } from '@/components/ui/button'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function MemberProjectsPage({ searchParams }: PageProps) {
  const user = await requireRole(['member'])
  const params = await searchParams
  const status = params.status ?? ''
  const search = params.search ?? ''
  const page = parseInt(params.page ?? '1', 10)

  const { items, pagination } = await listProjectsForUser({ user, status, search, page })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">案件管理</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total}件</p>
        </div>
        <Link href="/member/projects/new">
          <Button className="min-h-12">
            <Plus className="mr-2 h-4 w-4" />
            新規案件
          </Button>
        </Link>
      </div>

      <ProjectsFilterBar initialSearch={search} initialStatus={status} />

      <ProjectList projects={items} basePath="/member/projects" />

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/member/projects"
        searchParams={{ status, search }}
      />
    </div>
  )
}
