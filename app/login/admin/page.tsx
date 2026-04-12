import { LoginForm } from '@/components/auth/login-form'
import { Shield } from 'lucide-react'

export default function AdminLoginPage() {
  return (
    <LoginForm
      title="セリビオ管理者ログイン"
      description="セリビオ株式会社 管理システム"
      expectedRole="admin"
      icon={<Shield className="h-8 w-8 text-white" />}
      themeColor="blue"
      testAccounts={[
        { email: 'admin@celibio.com', label: '管理者' },
      ]}
    />
  )
}
