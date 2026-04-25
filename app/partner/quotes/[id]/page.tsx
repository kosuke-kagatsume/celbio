import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { PartnerQuoteRespondForm } from '@/components/quotes/partner-quote-respond-form'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { getQuoteForUser } from '@/lib/quotes/get-quote'

export default async function PartnerQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['partner'])
  const { id } = await params
  const result = await getQuoteForUser(id, user)

  if (result === null) notFound()
  if (result === 'forbidden') redirect('/partner/quotes')

  const quote = result
  const canRespond = quote.status === 'requested'

  const items = quote.items.map((item) => ({
    id: item.id,
    itemName: item.itemName,
    specification: item.specification,
    quantity: item.quantity != null ? String(item.quantity) : null,
    unit: item.unit,
    unitPrice: item.unitPrice != null ? String(item.unitPrice) : null,
    subtotal: item.subtotal != null ? String(item.subtotal) : null,
    status: item.status,
  }))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/partner/quotes">
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
        <Card>
          <CardHeader><CardTitle className="text-lg">依頼元情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="加盟店" value={quote.member.name} />
            <InfoRow label="担当者" value={quote.user.name} />
            <InfoRow label="カテゴリ" value={quote.category.name} />
            {quote.deliveryAddress && <InfoRow label="納品先" value={quote.deliveryAddress} />}
            {quote.desiredDate && <InfoRow label="希望納期" value={new Date(quote.desiredDate).toLocaleDateString('ja-JP')} />}
            <InfoRow label="依頼日" value={new Date(quote.createdAt).toLocaleDateString('ja-JP')} />
            {quote.description && (
              <div>
                <p className="text-sm text-gray-400 mb-1">依頼内容</p>
                <p className="text-sm whitespace-pre-wrap">{quote.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">見積明細 ({items.length})</CardTitle></CardHeader>
          <CardContent>
            <PartnerQuoteRespondForm quoteId={id} items={items} canRespond={canRespond} />
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
                </a>
              ))}
            </CardContent>
          </Card>
        )}
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
