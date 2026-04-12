import { LoginForm } from '@/components/auth/login-form'
import { Building2 } from 'lucide-react'

export default function MemberLoginPage() {
  return (
    <LoginForm
      title="加盟店ログイン"
      description="工務店・加盟店様専用ログイン"
      expectedRole="member"
      icon={<Building2 className="h-8 w-8 text-white" />}
      themeColor="green"
      testAccounts={[
        { email: 'member@example.com', label: 'サンプル工務店' },
        { email: 'tanaka@test-kensetsu.com', label: 'テスト建設' },
      ]}
    />
  )
}
