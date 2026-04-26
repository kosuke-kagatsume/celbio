import Link from 'next/link'
import { QuoteStatusBadge } from './quote-status-badge'
import type { PartnerQuoteListItem } from '@/lib/quotes/list-partner-quotes'

interface Props {
  quotes: PartnerQuoteListItem[]
}

export function PartnerQuoteList({ quotes }: Props) {
  if (quotes.length === 0) {
    return <p className="text-center text-gray-400 py-8">見積依頼はありません</p>
  }

  return (
    <div className="space-y-3">
      {quotes.map((q) => {
        const pendingCount = q.items.filter((i) => i.status !== 'quoted').length
        return (
          <Link key={q.id} href={`/partner/quotes/${q.id}`}>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">{q.quoteNumber}</span>
                    <QuoteStatusBadge status={q.status} />
                    {pendingCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {pendingCount}件未回答
                      </span>
                    )}
                  </div>
                  <p className="font-medium mt-1 truncate">{q.title ?? q.category.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{q.member.name}</p>
                </div>
                <div className="text-right shrink-0">
                  {q.totalAmount != null && (
                    <p className="font-semibold text-sm">¥{Number(q.totalAmount).toLocaleString('ja-JP')}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(q.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
