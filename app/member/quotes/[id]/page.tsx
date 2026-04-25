import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { QuoteItemsTable } from '@/components/quotes/quote-items-table'
import { MemberQuoteActions } from '@/components/quotes/member-quote-actions'
import { ArrowLeft, Download } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { getQuoteForUser } from '@/lib/quotes/get-quote'

export default async function MemberQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['member'])
  const { id } = await params
  const result = await getQuoteForUser(id, user)

  if (result === null) notFound()
  if (result === 'forbidden') redirect('/member/quotes')

  const quote = result
  const displayAmount = quote.memberTotalAmount
    ? `¥${Number(quote.memberTotalAmount).toLocaleString('ja-JP')}`
    : '-'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member/quotes">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">{quote.quoteNumber}</span>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <h1 className="text-xl font-bold mt-1">{quote.title ?? quote.category.name}</h1>
        </div>
      </div>

      <div className="space-y-4">
        {quote.project && (
          <Link href={`/member/projects/${quote.project.id}`}>
            <Card className="hover:bg-gray-50">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">案件</p>
                <p className="font-medium">{quote.project.projectNumber} - {quote.project.clientName} 様</p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-400">見積金額（税抜）</p>
            <p className="text-2xl font-bold mt-1">{displayAmount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="カテゴリ" value={quote.category.name} />
            <InfoRow label="依頼者" value={quote.user.name} />
            {quote.deliveryAddress && <InfoRow label="納品先" value={quote.deliveryAddress} />}
            {quote.desiredDate && <InfoRow label="希望納期" value={new Date(quote.desiredDate).toLocaleDateString('ja-JP')} />}
            <InfoRow label="作成日" value={new Date(quote.createdAt).toLocaleDateString('ja-JP')} />
            {quote.description && (
              <div>
                <p className="text-sm text-gray-400 mb-1">依頼内容</p>
                <p className="text-sm whitespace-pre-wrap">{quote.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">見積明細 ({quote.items.length})</CardTitle></CardHeader>
          <CardContent>
            <QuoteItemsTable items={quote.items} role="member" />
          </CardContent>
        </Card>

        {quote.files.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">添付ファイル</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quote.files.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
                   className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm text-blue-600">
                  {f.fileName}
                  {f.fileType && <span className="ml-2 text-gray-400">({f.fileType})</span>}
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3 pb-4">
          {['responded', 'approved'].includes(quote.status) && (
            <Button variant="outline" className="w-full min-h-12" asChild>
              <a href={`/api/quotes/${id}/pdf`} download>
                <Download className="mr-2 h-4 w-4" />見積書PDFダウンロード
              </a>
            </Button>
          )}
          <MemberQuoteActions quoteId={id} status={quote.status} displayAmount={displayAmount} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-sm text-gray-400 shrink-0 w-20">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  )
}
