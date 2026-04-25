'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calculator, Loader2 } from 'lucide-react'

export function RecalculateButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [isCalculating, setIsCalculating] = useState(false)

  const handleClick = async () => {
    setIsCalculating(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/calculate`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'エラーが発生しました')
      }
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isCalculating}>
      {isCalculating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Calculator className="mr-1 h-3 w-3" />}
      再計算
    </Button>
  )
}
