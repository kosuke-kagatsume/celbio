'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Loader2 } from 'lucide-react'

interface AreaMapping {
  id: string
  prefecture: string
  city: string | null
  priority: number
  isActive: boolean
}

export default function ElectricianAreaPage() {
  const [areas, setAreas] = useState<AreaMapping[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/electrician/area')
      .then((r) => r.ok ? r.json() : { areas: [] })
      .then((d) => setAreas(d.areas || []))
      .finally(() => setIsLoading(false))
  }, [])

  // 都道府県でグループ化
  const grouped = areas.reduce<Record<string, AreaMapping[]>>((acc, a) => {
    if (!acc[a.prefecture]) acc[a.prefecture] = []
    acc[a.prefecture].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">担当エリア</h1>
        <p className="text-muted-foreground">施工対応可能なエリア一覧</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>担当エリアが登録されていません</p>
              <p className="text-sm mt-1">管理者にお問い合わせください</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(grouped).map(([pref, mappings]) => (
            <Card key={pref}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  {pref}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mappings.map((m) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <span className="text-sm">
                        {m.city || '全域'}
                      </span>
                      <div className="flex items-center gap-2">
                        {m.priority > 0 && (
                          <span className="text-xs text-muted-foreground">
                            優先度: {m.priority}
                          </span>
                        )}
                        <Badge variant={m.isActive ? 'default' : 'secondary'}>
                          {m.isActive ? '有効' : '無効'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
