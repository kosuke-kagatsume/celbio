'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
}

interface SettingsPageProps {
  roleLabel: string
}

export function SettingsPage({ roleLabel }: SettingsPageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // パスワード変更
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setProfile(d))
      .finally(() => setIsLoading(false))
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('パスワードが一致しません')
      return
    }

    setIsChanging(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPasswordError('パスワード変更に失敗しました')
    } finally {
      setIsChanging(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground">アカウント設定</p>
      </div>

      {/* プロフィール */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            プロフィール
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">名前</Label>
              <p className="font-medium">{profile?.name || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">メールアドレス</Label>
              <p className="font-medium">{profile?.email || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">ロール</Label>
              <p className="font-medium">{roleLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* パスワード変更 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            パスワード変更
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                className="min-h-12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8文字以上"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="min-h-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再入力"
                required
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                パスワードを変更しました
              </p>
            )}

            <Button type="submit" disabled={isChanging} className="min-h-12">
              {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              パスワードを変更
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
