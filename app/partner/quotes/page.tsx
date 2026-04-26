import { requireRole } from '@/lib/auth'
import { listPartnerQuotes } from '@/lib/quotes/list-partner-quotes'
import { PartnerQuoteList } from '@/components/quotes/partner-quote-list'
import { QuotesFilterBar } from '@/components/quotes/quotes-filter-bar'
import { ListPagination } from '@/components/common/list-pagination'

const PARTNER_QUOTE_STATUSES = {
  requested: '回答待ち',
  responded: '回答済',
  approved: '承認済',
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function PartnerQuotesPage({ searchParams }: PageProps) {
  const user = await requireRole(['partner'])
  const params = await searchParams
  const status = params.status ?? ''
  const page = parseInt(params.page ?? '1', 10)

  const { items, pagination } = await listPartnerQuotes({ user, status, page })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">見積回答</h1>
        <p className="text-sm text-gray-500 mt-1">
          受信した見積依頼 ({pagination.total}件)
        </p>
      </div>

      <QuotesFilterBar initialStatus={status} statuses={PARTNER_QUOTE_STATUSES} />

      <PartnerQuoteList quotes={items} />

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/partner/quotes"
        searchParams={{ status }}
      />
    </div>
  )
}
