'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleMapPicker } from '@/components/maps/google-map-picker'
import { FileUpload, FileListItem } from '@/components/files/file-upload'
import { Loader2 } from 'lucide-react'
import { FILE_TYPES, type ProjectFileType } from '@/lib/project-constants'

interface ProjectFormData {
  clientName: string
  clientNameKana: string
  postalCode: string
  address: string
  addressDetail: string
  buildingType: string
  roofType: string
  notes: string
  latitude: number | null
  longitude: number | null
}

interface UploadedFile {
  id: string
  fileName: string
  fileSize: number | null
  url: string
  fileType: string
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>
  initialFiles?: UploadedFile[]
  projectId?: string
  mode: 'create' | 'edit'
}

const BUILDING_TYPES = ['戸建', '集合住宅', '店舗', 'その他']
const ROOF_TYPES = ['切妻', '寄棟', '片流れ', '陸屋根', 'その他']

export function ProjectForm({ initialData, initialFiles, projectId, mode }: ProjectFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<ProjectFileType>('drawing')
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles ?? [])

  const [form, setForm] = useState<ProjectFormData>({
    clientName: initialData?.clientName ?? '',
    clientNameKana: initialData?.clientNameKana ?? '',
    postalCode: initialData?.postalCode ?? '',
    address: initialData?.address ?? '',
    addressDetail: initialData?.addressDetail ?? '',
    buildingType: initialData?.buildingType ?? '',
    roofType: initialData?.roofType ?? '',
    notes: initialData?.notes ?? '',
    latitude: initialData?.latitude ?? null,
    longitude: initialData?.longitude ?? null,
  })

  const updateField = <K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientName.trim()) {
      setError('施主名は必須です')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const url = mode === 'create' ? '/api/projects' : `/api/projects/${projectId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '保存に失敗しました')
      }

      const project = await res.json()
      router.push(`/member/projects/${project.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!projectId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', fileType)

    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      throw new Error('アップロードに失敗しました')
    }

    const uploaded = await res.json()
    setFiles((prev) => [uploaded, ...prev])
  }

  const handleFileDelete = async (fileId: string) => {
    if (!projectId) return

    const res = await fetch(`/api/projects/${projectId}/files?fileId=${fileId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      {/* 施主情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">施主情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">施主名 *</Label>
            <Input
              id="clientName"
              value={form.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              placeholder="例: 岩波悠太"
              required
              className="min-h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientNameKana">施主名（カナ）</Label>
            <Input
              id="clientNameKana"
              value={form.clientNameKana}
              onChange={(e) => updateField('clientNameKana', e.target.value)}
              placeholder="例: イワナミユウタ"
              className="min-h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* 住所・地図 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">現場住所</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">郵便番号</Label>
            <Input
              id="postalCode"
              value={form.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              placeholder="例: 520-0000"
              className="min-h-12 max-w-[200px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="例: 滋賀県大津市○○町1-2-3"
              className="min-h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressDetail">補足（区画番号等）</Label>
            <Input
              id="addressDetail"
              value={form.addressDetail}
              onChange={(e) => updateField('addressDetail', e.target.value)}
              placeholder="例: 6号地"
              className="min-h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>地図ピン</Label>
            <GoogleMapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onLocationChange={(lat, lng) => {
                updateField('latitude', lat)
                updateField('longitude', lng)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 建物情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">建物情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>建物種別</Label>
            <Select value={form.buildingType} onValueChange={(v) => updateField('buildingType', v)}>
              <SelectTrigger className="min-h-12">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {BUILDING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>屋根形状</Label>
            <Select value={form.roofType} onValueChange={(v) => updateField('roofType', v)}>
              <SelectTrigger className="min-h-12">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {ROOF_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="その他の情報があれば入力してください"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* ファイルアップロード（編集時のみ） */}
      {mode === 'edit' && projectId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">添付ファイル</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ファイル種別</Label>
              <Select value={fileType} onValueChange={(v) => setFileType(v as ProjectFileType)}>
                <SelectTrigger className="min-h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FILE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FileUpload
              onUpload={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
            />
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f) => (
                  <FileListItem
                    key={f.id}
                    name={f.fileName}
                    size={f.fileSize}
                    url={f.url}
                    onDelete={() => handleFileDelete(f.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 送信ボタン */}
      <Button type="submit" className="w-full min-h-12" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            保存中...
          </>
        ) : (
          mode === 'create' ? '案件を登録' : '変更を保存'
        )}
      </Button>
    </form>
  )
}
