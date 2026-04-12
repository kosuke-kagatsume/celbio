'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectStatusBadge } from '@/components/projects/project-status-badge'
import { FileListItem } from '@/components/files/file-upload'
import { FILE_TYPES, type ProjectFileType } from '@/lib/projects'
import { ArrowLeft, MapPin, FileText, ShoppingCart, CreditCard, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ProjectDetail {
  id: string
  projectNumber: string
  clientName: string
  clientNameKana: string | null
  postalCode: string | null
  address: string | null
  addressDetail: string | null
  latitude: number | null
  longitude: number | null
  buildingType: string | null
  roofType: string | null
  notes: string | null
  status: string
  createdAt: string
  paymentConfirmedAt: string | null
  member: { id: string; name: string }
  createdByUser: { id: string; name: string }
  files: Array<{ id: string; fileName: string; fileSize: number | null; fileUrl: string; fileType: string }>
  quotes: Array<{ id: string; quoteNumber: string; status: string; totalAmount: string | null; createdAt: string }>
  orders: Array<{ id: string; orderNumber: string; status: string; totalAmount: string; createdAt: string }>
  memberPayments: Array<{ id: string; amount: string; status: string; paymentType: string; confirmedAt: string | null }>
}

export default function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setProject(data))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!project) {
    return <p className="text-center py-12 text-gray-500">案件が見つかりません</p>
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/projects">
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
      </div>

      <div className="space-y-4">
        {/* 加盟店情報 */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">加盟店</p>
              <p className="font-medium">{project.member.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {project.clientNameKana && <InfoRow label="施主名（カナ）" value={project.clientNameKana} />}
            {project.address && <InfoRow label="住所" value={project.address} icon={<MapPin className="h-4 w-4" />} />}
            {project.addressDetail && <InfoRow label="補足" value={project.addressDetail} />}
            {project.buildingType && <InfoRow label="建物種別" value={project.buildingType} />}
            {project.roofType && <InfoRow label="屋根形状" value={project.roofType} />}
            {project.notes && <InfoRow label="備考" value={project.notes} />}
            <InfoRow label="登録者" value={project.createdByUser.name} />
            <InfoRow label="登録日" value={new Date(project.createdAt).toLocaleDateString('ja-JP')} />
            {project.paymentConfirmedAt && (
              <InfoRow label="入金確認" value={new Date(project.paymentConfirmedAt).toLocaleDateString('ja-JP')} />
            )}
          </CardContent>
        </Card>

        {/* ファイル */}
        {project.files.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">添付ファイル ({project.files.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {project.files.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">{FILE_TYPES[f.fileType as ProjectFileType] ?? f.fileType}</span>
                  <FileListItem name={f.fileName} size={f.fileSize} url={f.fileUrl} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 見積・発注・入金 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">見積 ({project.quotes.length})</CardTitle></CardHeader>
          <CardContent>
            {project.quotes.length === 0 ? (
              <p className="text-sm text-gray-400">まだ見積はありません</p>
            ) : (
              <div className="space-y-2">
                {project.quotes.map((q) => (
                  <Link key={q.id} href={`/admin/quotes/${q.id}`}>
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
          <CardHeader><CardTitle className="text-lg">発注 ({project.orders.length})</CardTitle></CardHeader>
          <CardContent>
            {project.orders.length === 0 ? (
              <p className="text-sm text-gray-400">まだ発注はありません</p>
            ) : (
              <div className="space-y-2">
                {project.orders.map((o) => (
                  <Link key={o.id} href={`/admin/orders/${o.id}`}>
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
            <CardHeader><CardTitle className="text-lg">入金 ({project.memberPayments.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {project.memberPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold">{Number(p.amount).toLocaleString('ja-JP')}円</span>
                  <span className="text-xs text-gray-400">{p.status}</span>
                </div>
              ))}
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
      <span className="text-sm text-gray-700 flex items-center gap-1">{icon}{value}</span>
    </div>
  )
}
