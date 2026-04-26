import { requireRole } from '@/lib/auth'
import { listQuotesForUser } from '@/lib/quotes/list-quotes'
import { QuoteList } from '@/components/quotes/quote-list'
import { QuotesFilterBar } from '@/components/quotes/quotes-filter-bar'
import { ListPagination } from '@/components/common/list-pagination'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminQuotesPage({ searchParams }: PageProps) {
  const user = await requireRole(['admin'])
  const params = await searchParams
  const status = params.status ?? ''
  const page = parseInt(params.page ?? '1', 10)

  const { items, pagination } = await listQuotesForUser({ user, status, page })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">見積管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          全加盟店の見積一覧 ({pagination.total}件)
        </p>
      </div>

      <QuotesFilterBar initialStatus={status} />

      <QuoteList quotes={items} basePath="/admin/quotes" role="admin" showMember />

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/admin/quotes"
        searchParams={{ status }}
      />
    </div>
  )
}
