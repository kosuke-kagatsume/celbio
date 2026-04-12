'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/auth'

interface LoginFormProps {
  title: string
  description: string
  expectedRole: UserRole
  icon: React.ReactNode
  themeColor: string // Tailwind色プレフィックス（例: 'blue', 'green'）
  testAccounts?: { email: string; label: string }[]
}

const themeMap: Record<string, { bg: string; button: string; buttonHover: string; iconBg: string }> = {
  blue: { bg: 'from-blue-50 to-indigo-100', button: 'bg-blue-600', buttonHover: 'hover:bg-blue-700', iconBg: 'bg-blue-600' },
  green: { bg: 'from-green-50 to-emerald-100', button: 'bg-green-600', buttonHover: 'hover:bg-green-700', iconBg: 'bg-green-600' },
  orange: { bg: 'from-orange-50 to-amber-100', button: 'bg-orange-600', buttonHover: 'hover:bg-orange-700', iconBg: 'bg-orange-600' },
  yellow: { bg: 'from-yellow-50 to-amber-100', button: 'bg-yellow-600', buttonHover: 'hover:bg-yellow-700', iconBg: 'bg-yellow-600' },
}

const roleDashboardMap: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  member: '/member/dashboard',
  partner: '/partner/dashboard',
  electrician: '/electrician/dashboard',
}

const roleErrorMessages: Record<UserRole, string> = {
  admin: 'このアカウントは管理者用ではありません',
  member: 'このアカウントは加盟店用ではありません',
  partner: 'このアカウントはメーカー用ではありません',
  electrician: 'このアカウントは電気工事屋用ではありません',
}

export function LoginForm({ title, description, expectedRole, icon, themeColor, testAccounts }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const theme = themeMap[themeColor] ?? themeMap.blue

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('メールアドレスまたはパスワードが正しくありません')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const user = await response.json()

        // ロール検証: ログインページのロールとDBのロールが一致するか
        if (user.role !== expectedRole) {
          // ログアウトしてエラー表示
          await supabase.auth.signOut()
          setError(roleErrorMessages[expectedRole])
          setIsLoading(false)
          return
        }

        router.push(roleDashboardMap[user.role as UserRole] ?? '/login')
      } else {
        setError('ユーザー情報の取得に失敗しました')
        setIsLoading(false)
      }
    } catch {
      setError('ログインに失敗しました')
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${theme.bg} p-4`}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className={`${theme.iconBg} p-3 rounded-full`}>
              {icon}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="min-h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="min-h-12"
              />
            </div>
            <Button
              type="submit"
              className={`w-full min-h-12 ${theme.button} ${theme.buttonHover}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>

          {testAccounts && testAccounts.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-semibold mb-2">テストアカウント:</p>
              {testAccounts.map((account) => (
                <p key={account.email}>{account.label}: {account.email}</p>
              ))}
              <p className="mt-2 font-medium text-gray-700">パスワード: Test1234!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
