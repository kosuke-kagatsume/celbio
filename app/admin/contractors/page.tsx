'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, HardHat, MapPin } from 'lucide-react'

interface AreaMapping {
  id: string
  prefecture: string
  city: string | null
  priority: number
}

interface Contractor {
  id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  isActive: boolean
  areaMappings: AreaMapping[]
  _count: { products: number; quoteItems: number; orderItems: number }
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchContractors() }, [])

  const fetchContractors = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/partners?type=electrician')
      if (res.ok) {
        const data = await res.json()
        setContractors(data.partners ?? [])
      }
    } finally { setIsLoading(false) }
  }

  const activeCount = contractors.filter((c) => c.isActive).length
  const totalAreas = contractors.reduce((sum, c) => sum + (c.areaMappings?.length ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">施工パートナー管理</h1>
          <p className="text-sm text-gray-500 mt-1">施工パートナーの登録・エリア管理</p>
        </div>
        <Link href="/admin/partners/new?type=electrician">
          <Button className="min-h-12">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </Link>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{contractors.length}</p>
          <p className="text-xs text-gray-500">登録数</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-xs text-gray-500">有効</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totalAreas}</p>
          <p className="text-xs text-gray-500">エリア設定</p>
        </div>
      </div>

      {/* 一覧 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : contractors.length === 0 ? (
        <p className="text-center text-gray-400 py-8">施工パートナーが登録されていません</p>
      ) : (
        <div className="space-y-3">
          {contractors.map((c) => (
            <div key={c.id} className={`border rounded-lg p-4 ${!c.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <HardHat className="h-4 w-4 text-yellow-600 shrink-0" />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{c.code}</span>
                    <Badge variant={c.isActive ? 'default' : 'secondary'} className="text-xs">
                      {c.isActive ? '有効' : '無効'}
                    </Badge>
                  </div>
                  {(c.phone || c.email) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {c.phone}{c.phone && c.email ? ' / ' : ''}{c.email}
                    </p>
                  )}
                  {/* エリアマッピング */}
                  {c.areaMappings && c.areaMappings.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                      {c.areaMappings.map((a) => (
                        <Badge key={a.id} variant="outline" className="text-xs">
                          {a.prefecture}{a.city ? ` ${a.city}` : ''}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    施工実績: {c._count.orderItems}件
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
