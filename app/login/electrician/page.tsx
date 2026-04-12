import { LoginForm } from '@/components/auth/login-form'
import { Zap } from 'lucide-react'

export default function ElectricianLoginPage() {
  return (
    <LoginForm
      title="電気工事屋ログイン"
      description="電気工事・協力会社様専用ログイン"
      expectedRole="electrician"
      icon={<Zap className="h-8 w-8 text-white" />}
      themeColor="yellow"
      testAccounts={[
        { email: 'sato@kanto-densetsu.com', label: '関東電設' },
        { email: 'honda@kansai-denko.com', label: '関西電工' },
      ]}
    />
  )
}
