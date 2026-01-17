import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Step 1: Supabase認証チェック
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: 'Auth error', details: authError.message },
        { status: 401 }
      )
    }

    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Step 2: DBからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
      include: {
        member: true,
        partner: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database', supabaseId: supabaseUser.id },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberId: user.memberId,
      partnerId: user.partnerId,
      memberName: user.member?.name,
      partnerName: user.partner?.name,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
