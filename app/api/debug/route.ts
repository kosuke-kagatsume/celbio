import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// デバッグ用エンドポイント - 各ステップの結果を返す
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: {},
  }

  // Step 1: 環境変数の確認
  results.steps = {
    ...results.steps as object,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET',
      DIRECT_URL: process.env.DIRECT_URL ? `${process.env.DIRECT_URL.substring(0, 30)}...` : 'NOT SET',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    },
  }

  // Step 2: Supabaseクライアント作成
  try {
    const supabase = await createClient()
    results.steps = {
      ...results.steps as object,
      supabaseClient: 'OK',
    }

    // Step 3: Supabase認証状態確認
    try {
      const { data, error } = await supabase.auth.getUser()
      results.steps = {
        ...results.steps as object,
        supabaseAuth: {
          success: !error,
          error: error?.message || null,
          userId: data?.user?.id || null,
          userEmail: data?.user?.email || null,
        },
      }
    } catch (authError) {
      results.steps = {
        ...results.steps as object,
        supabaseAuth: {
          success: false,
          error: authError instanceof Error ? authError.message : 'Unknown error',
        },
      }
    }
  } catch (clientError) {
    results.steps = {
      ...results.steps as object,
      supabaseClient: {
        success: false,
        error: clientError instanceof Error ? clientError.message : 'Unknown error',
      },
    }
  }

  // Step 4: Prismaデータベース接続テスト
  try {
    const { prisma } = await import('@/lib/prisma')

    // 簡単なクエリを実行
    const userCount = await prisma.user.count()
    const memberCount = await prisma.member.count()
    const partnerCount = await prisma.partner.count()

    results.steps = {
      ...results.steps as object,
      prismaConnection: {
        success: true,
        userCount,
        memberCount,
        partnerCount,
      },
    }

    // Step 5: 特定ユーザーの存在確認
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@celibio.com' },
      select: { id: true, email: true, name: true, role: true, supabaseUserId: true },
    })

    results.steps = {
      ...results.steps as object,
      adminUserCheck: adminUser ? {
        exists: true,
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        hasSupabaseId: !!adminUser.supabaseUserId,
      } : {
        exists: false,
      },
    }
  } catch (dbError) {
    results.steps = {
      ...results.steps as object,
      prismaConnection: {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack?.split('\n').slice(0, 5) : null,
      },
    }
  }

  return NextResponse.json(results)
}
