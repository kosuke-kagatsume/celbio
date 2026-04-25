import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectStatusBadge } from '@/components/projects/project-status-badge'
import { FileListItem } from '@/components/files/file-upload'
import { FILE_TYPES, type ProjectFileType } from '@/lib/projects'
import { ArrowLeft, Edit, MapPin, FileText, ShoppingCart, CreditCard } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { getProjectForUser } from '@/lib/projects/get-project'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['member'])
  const { id } = await params
  const result = await getProjectForUser(id, user)

  if (result === null) notFound()
  if (result === 'forbidden') redirect('/member/projects')

  const project = result
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasCoords = project.latitude != null && project.longitude != null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member/projects">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">{project.projectNumber}</span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h1 className="text-xl font-bold mt-1">{project.clientName} 様</h1>
        </div>
        <Link href={`/member/projects/${id}/edit`}>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.clientNameKana && <InfoRow label="施主名（カナ）" value={project.clientNameKana} />}
            {project.postalCode && <InfoRow label="郵便番号" value={project.postalCode} />}
            {project.address && <InfoRow label="住所" value={project.address} icon={<MapPin className="h-4 w-4" />} />}
            {project.addressDetail && <InfoRow label="補足" value={project.addressDetail} />}
            {project.buildingType && <InfoRow label="建物種別" value={project.buildingType} />}
            {project.roofType && <InfoRow label="屋根形状" value={project.roofType} />}
            {project.notes && <InfoRow label="備考" value={project.notes} />}
          </CardContent>
        </Card>

        {hasCoords && apiKey && (
          <Card>
            <CardContent className="p-0">
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${project.latitude},${project.longitude}&zoom=16`}
              />
            </CardContent>
          </Card>
        )}

        {project.files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                添付ファイル ({project.files.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.files.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">
                    {FILE_TYPES[f.fileType as ProjectFileType] ?? f.fileType}
                  </span>
                  <FileListItem name={f.fileName} size={f.fileSize} url={f.url} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              見積 ({project.quotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.quotes.length === 0 ? (
              <p className="text-sm text-gray-400">まだ見積はありません</p>
            ) : (
              <div className="space-y-2">
                {project.quotes.map((q) => (
                  <Link key={q.id} href={`/member/quotes/${q.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <span className="text-sm font-mono">{q.quoteNumber}</span>
                      <span className="text-xs text-gray-400">{q.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              発注 ({project.orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.orders.length === 0 ? (
              <p className="text-sm text-gray-400">まだ発注はありません</p>
            ) : (
              <div className="space-y-2">
                {project.orders.map((o) => (
                  <Link key={o.id} href={`/member/orders/${o.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <span className="text-sm font-mono">{o.orderNumber}</span>
                      <span className="text-xs text-gray-400">{o.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {project.memberPayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                入金 ({project.memberPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.memberPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-semibold">
                      {Number(p.amount).toLocaleString('ja-JP')}円
                    </span>
                    <span className="text-xs text-gray-400">{p.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-sm text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-sm text-gray-700 flex items-center gap-1">
        {icon}
        {value}
      </span>
    </div>
  )
}
