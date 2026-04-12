import { LoginForm } from '@/components/auth/login-form'
import { Factory } from 'lucide-react'

export default function PartnerLoginPage() {
  return (
    <LoginForm
      title="メーカーログイン"
      description="メーカー・仕入先様専用ログイン"
      expectedRole="partner"
      icon={<Factory className="h-8 w-8 text-white" />}
      themeColor="orange"
      testAccounts={[
        { email: 'partner@example.com', label: 'ソーラーテック' },
        { email: 'ito@insulation.com', label: '断熱マテリアル' },
      ]}
    />
  )
}
