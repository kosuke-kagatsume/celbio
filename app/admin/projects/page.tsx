import { requireRole } from '@/lib/auth'
import { listProjectsForUser } from '@/lib/projects/list-projects'
import { ProjectList } from '@/components/projects/project-list'
import { ProjectsFilterBar } from '@/components/projects/projects-filter-bar'
import { ListPagination } from '@/components/common/list-pagination'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const user = await requireRole(['admin'])
  const params = await searchParams
  const status = params.status ?? ''
  const search = params.search ?? ''
  const page = parseInt(params.page ?? '1', 10)

  const { items, pagination } = await listProjectsForUser({ user, status, search, page })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">案件管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          全加盟店の案件一覧 ({pagination.total}件)
        </p>
      </div>

      <ProjectsFilterBar initialSearch={search} initialStatus={status} />

      <ProjectList projects={items} basePath="/admin/projects" showMember />

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/admin/projects"
        searchParams={{ status, search }}
      />
    </div>
  )
}
