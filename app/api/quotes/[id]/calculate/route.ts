import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { calculateQuoteMargins } from '@/lib/margin'

type RouteParams = { params: Promise<{ id: string }> }

/** POST /api/quotes/[id]/calculate — マージン計算を手動実行（管理者のみ） */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const result = await calculateQuoteMargins(id)

    return NextResponse.json({
      message: 'マージン計算完了',
      ...result,
    })
  } catch (error) {
    console.error('Error calculating margins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
