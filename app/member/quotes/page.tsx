import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { listQuotesForUser } from '@/lib/quotes/list-quotes'
import { QuoteList } from '@/components/quotes/quote-list'
import { QuotesFilterBar } from '@/components/quotes/quotes-filter-bar'
import { ListPagination } from '@/components/common/list-pagination'
import { Button } from '@/components/ui/button'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function MemberQuotesPage({ searchParams }: PageProps) {
  const user = await requireRole(['member'])
  const params = await searchParams
  const status = params.status ?? ''
  const page = parseInt(params.page ?? '1', 10)

  const { items, pagination } = await listQuotesForUser({ user, status, page })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">見積依頼</h1>
          <p className="text-sm text-gray-500 mt-1">
            見積一覧 ({pagination.total}件)
          </p>
        </div>
        <Link href="/member/quotes/new">
          <Button className="min-h-12">新規依頼</Button>
        </Link>
      </div>

      <QuotesFilterBar initialStatus={status} />

      <QuoteList quotes={items} basePath="/member/quotes" role="member" />

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/member/quotes"
        searchParams={{ status }}
      />
    </div>
  )
}
