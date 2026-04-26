import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'member' | 'partner' | 'electrician'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  memberId?: string | null
  partnerId?: string | null
  memberName?: string
  partnerName?: string
}

/**
 * 現在のログインユーザーを取得（リクエスト内で1度だけ実行）
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()

  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  if (!supabaseUser) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { supabaseUserId: supabaseUser.id },
    include: {
      member: { select: { id: true, name: true } },
      partner: { select: { id: true, name: true } },
    },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    memberId: user.memberId,
    partnerId: user.partnerId,
    memberName: user.member?.name,
    partnerName: user.partner?.name,
  }
})

/**
 * 認証必須のページで使用
 * 未ログインの場合はログインページにリダイレクト
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * 特定の役割が必要なページで使用
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    // 権限がない場合はダッシュボードにリダイレクト
    redirect(getRoleDashboard(user.role))
  }

  return user
}

/**
 * 役割に応じたダッシュボードURLを取得
 */
export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'member':
      return '/member/dashboard'
    case 'partner':
      return '/partner/dashboard'
    case 'electrician':
      return '/electrician/dashboard'
    default:
      return '/login'
  }
}

/**
 * 役割に応じたルートプレフィックスを取得
 */
export function getRolePrefix(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'member':
      return '/member'
    case 'partner':
      return '/partner'
    case 'electrician':
      return '/electrician'
    default:
      return ''
  }
}

/**
 * 現在のログインユーザーを取得（エイリアス）
 */
export const getCurrentUser = getUser
