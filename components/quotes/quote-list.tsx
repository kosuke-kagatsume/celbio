'use client'

import Link from 'next/link'
import { QuoteStatusBadge } from './quote-status-badge'
import type { UserRole } from '@/lib/auth'

interface QuoteListItem {
  id: string
  quoteNumber: string
  title: string | null
  status: string
  totalAmount?: string | null
  memberTotalAmount?: string | null
  createdAt: string
  category: { id: string; name: string }
  member?: { id: string; name: string }
  project?: { id: string; projectNumber: string; clientName: string } | null
}

interface QuoteListProps {
  quotes: QuoteListItem[]
  basePath: string
  role: UserRole
  showMember?: boolean
}

function formatAmount(value: string | number | null | undefined): string {
  if (value == null) return '-'
  return `¥${Number(value).toLocaleString('ja-JP')}`
}

export function QuoteList({ quotes, basePath, role, showMember }: QuoteListProps) {
  if (quotes.length === 0) {
    return <p className="text-center text-gray-400 py-8">見積はありません</p>
  }

  return (
    <div className="space-y-3">
      {quotes.map((q) => {
        // ロールに応じた表示金額
        const displayAmount =
          role === 'member' ? q.memberTotalAmount :
          role === 'partner' ? q.totalAmount :
          q.memberTotalAmount ?? q.totalAmount

        return (
          <Link key={q.id} href={`${basePath}/${q.id}`}>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">{q.quoteNumber}</span>
                    <QuoteStatusBadge status={q.status} />
                  </div>
                  <p className="font-medium mt-1 truncate">
                    {q.title ?? q.category.name}
                  </p>
                  {q.project && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {q.project.projectNumber} - {q.project.clientName} 様
                    </p>
                  )}
                  {showMember && q.member && (
                    <p className="text-xs text-gray-400 mt-0.5">{q.member.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {displayAmount != null && (
                    <p className="font-semibold text-sm">{formatAmount(displayAmount)}</p>
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
