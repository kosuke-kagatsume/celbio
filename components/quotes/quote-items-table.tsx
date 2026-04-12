'use client'

import type { UserRole } from '@/lib/auth'

interface QuoteItemData {
  id: string
  itemName: string
  specification: string | null
  quantity: string | null
  unit: string | null
  unitPrice?: string | null      // 原価（member非表示）
  subtotal?: string | null        // 原価小計（member非表示）
  memberUnitPrice?: string | null // マージン込み単価
  memberSubtotal?: string | null  // マージン込み小計
  status: string | null
  partner: { id: string; name: string }
  product?: { id: string; name: string } | null
}

interface QuoteItemsTableProps {
  items: QuoteItemData[]
  role: UserRole
}

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return '-'
  return Number(value).toLocaleString('ja-JP')
}

export function QuoteItemsTable({ items, role }: QuoteItemsTableProps) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">明細なし</p>
  }

  // モバイル: カード表示
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{item.itemName}</p>
              {item.specification && (
                <p className="text-xs text-gray-400 mt-0.5">{item.specification}</p>
              )}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{item.partner.name}</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {item.quantity != null && (
              <span className="text-gray-500">
                数量: {Number(item.quantity).toLocaleString('ja-JP')}{item.unit ?? ''}
              </span>
            )}

            {/* admin: 原価とマージン込み両方表示 */}
            {role === 'admin' && (
              <>
                <span className="text-gray-500">
                  原価: ¥{formatPrice(item.unitPrice)}
                </span>
                {item.memberUnitPrice != null && (
                  <span className="text-blue-600 font-medium">
                    売価: ¥{formatPrice(item.memberUnitPrice)}
                  </span>
                )}
              </>
            )}

            {/* member: マージン込み価格のみ */}
            {role === 'member' && item.memberUnitPrice != null && (
              <span className="font-medium">
                単価: ¥{formatPrice(item.memberUnitPrice)}
              </span>
            )}

            {/* partner: 原価のみ */}
            {role === 'partner' && item.unitPrice != null && (
              <span className="font-medium">
                単価: ¥{formatPrice(item.unitPrice)}
              </span>
            )}
          </div>

          {/* 小計 */}
          <div className="flex justify-end text-sm">
            {role === 'admin' && (
              <div className="flex gap-4">
                <span className="text-gray-500">原価計: ¥{formatPrice(item.subtotal)}</span>
                {item.memberSubtotal != null && (
                  <span className="text-blue-600 font-semibold">売価��: ¥{formatPrice(item.memberSubtotal)}</span>
                )}
              </div>
            )}
            {role === 'member' && item.memberSubtotal != null && (
              <span className="font-semibold">小計: ¥{formatPrice(item.memberSubtotal)}</span>
            )}
            {role === 'partner' && item.subtotal != null && (
              <span className="font-semibold">小計: ¥{formatPrice(item.subtotal)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
