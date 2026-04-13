'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react'

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]

interface PartnerOption { id: string; name: string; code: string }
interface AreaMapping {
  id: string
  partnerId: string
  prefecture: string
  city: string | null
  priority: number
  isActive: boolean
  partner: PartnerOption
}

interface FormState {
  partnerId: string
  prefecture: string
  city: string
  priority: string
}

const emptyForm: FormState = { partnerId: '', prefecture: '', city: '', priority: '0' }

export default function AreaMappingsPage() {
  const [mappings, setMappings] = useState<AreaMapping[]>([])
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterPref, setFilterPref] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { fetchData() }, [filterPref])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterPref) params.set('prefecture', filterPref)
      const [mappingsRes, partnersRes] = await Promise.all([
        fetch(`/api/admin/area-mappings?${params}`),
        fetch('/api/admin/partners?type=electrician'),
      ])
      if (mappingsRes.ok) {
        const data = await mappingsRes.json()
        setMappings(data.mappings)
      }
      if (partnersRes.ok) {
        const data = await partnersRes.json()
        setPartners(data.partners ?? [])
      }
    } finally { setIsLoading(false) }
  }

  const handleSave = async () => {
    if (!form.partnerId || !form.prefecture) return
    setIsSaving(true)
    try {
      const body = {
        ...(editId && { id: editId }),
        partnerId: form.partnerId,
        prefecture: form.prefecture,
        city: form.city || null,
        priority: parseInt(form.priority) || 0,
      }
      const res = await fetch('/api/admin/area-mappings', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setForm(emptyForm)
        setEditId(null)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'エラーが発生しました')
      }
    } finally { setIsSaving(false) }
  }

  const handleEdit = (m: AreaMapping) => {
    setEditId(m.id)
    setForm({
      partnerId: m.partnerId,
      prefecture: m.prefecture,
      city: m.city || '',
      priority: String(m.priority),
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    const res = await fetch(`/api/admin/area-mappings?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  const handleToggle = async (m: AreaMapping) => {
    await fetch('/api/admin/area-mappings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, isActive: !m.isActive }),
    })
    fetchData()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">エリアマッピング</h1>
        <p className="text-sm text-gray-500 mt-1">施工パートナーの担当エリア管理</p>
      </div>

      {/* フィルタ */}
      <div className="mb-4">
        <Select value={filterPref || 'all'} onValueChange={(v) => setFilterPref(v === 'all' ? '' : v)}>
          <SelectTrigger className="min-h-12"><SelectValue placeholder="都道府県で絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            {PREFECTURES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* 作成/編集フォーム */}
      <div className="border rounded-lg p-4 mb-6 space-y-3">
        <h2 className="text-sm font-bold text-gray-500">{editId ? 'エリアマッピング編集' : '新規追加'}</h2>
        <Select value={form.partnerId || undefined} onValueChange={(v) => setForm({ ...form, partnerId: v })}>
          <SelectTrigger className="min-h-12"><SelectValue placeholder="施工パートナーを選択" /></SelectTrigger>
          <SelectContent>
            {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={form.prefecture || undefined} onValueChange={(v) => setForm({ ...form, prefecture: v })}>
          <SelectTrigger className="min-h-12"><SelectValue placeholder="都道府県を選択" /></SelectTrigger>
          <SelectContent>
            {PREFECTURES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="市区町村（空欄=県全体）"
          className="min-h-12"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <Input
          type="number"
          placeholder="優先度"
          className="min-h-12"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        />
        <div className="flex gap-2">
          <Button className="flex-1 min-h-12" onClick={handleSave} disabled={isSaving || !form.partnerId || !form.prefecture}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {editId ? '更新' : '追加'}
          </Button>
          {editId && (
            <Button variant="outline" className="min-h-12" onClick={() => { setEditId(null); setForm(emptyForm) }}>
              キャンセル
            </Button>
          )}
        </div>
      </div>

      {/* 一覧 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : mappings.length === 0 ? (
        <p className="text-center text-gray-400 py-8">エリアマッピングがありません</p>
      ) : (
        <div className="space-y-3">
          {mappings.map((m) => (
            <div key={m.id} className={`border rounded-lg p-4 ${!m.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.partner.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {m.prefecture}{m.city ? ` ${m.city}` : '（県全体）'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">優先度: {m.priority}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(m)}>
                    <span className={`text-xs ${m.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {m.isActive ? 'ON' : 'OFF'}
                    </span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(m)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
