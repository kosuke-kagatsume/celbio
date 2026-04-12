'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

interface GoogleMapPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (lat: number | null, lng: number | null) => void
}

/**
 * Googleマップピン打ちコンポーネント
 * APIキー未設定時は緯度・経度の手動入力 + 静的マップ表示
 */
export function GoogleMapPicker({ latitude, longitude, onLocationChange }: GoogleMapPickerProps) {
  const [lat, setLat] = useState(latitude?.toString() ?? '')
  const [lng, setLng] = useState(longitude?.toString() ?? '')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const handleApply = () => {
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      onLocationChange(parsedLat, parsedLng)
    } else {
      onLocationChange(null, null)
    }
  }

  const hasCoords = latitude != null && longitude != null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="latitude" className="text-sm">緯度</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="35.0116"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onBlur={handleApply}
            className="min-h-12"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="longitude" className="text-sm">経度</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="135.7681"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            onBlur={handleApply}
            className="min-h-12"
          />
        </div>
      </div>

      {/* 地図プレビュー */}
      {hasCoords && apiKey && (
        <div className="rounded-lg overflow-hidden border">
          <iframe
            width="100%"
            height="200"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=16`}
          />
        </div>
      )}

      {hasCoords && !apiKey && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>位置情報設定済み: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}</span>
        </div>
      )}

      {!hasCoords && (
        <p className="text-xs text-gray-400">
          建築中の住所はまだ地図に表示されない場合があります。緯度・経度を直接入力してください。
        </p>
      )}
    </div>
  )
}
