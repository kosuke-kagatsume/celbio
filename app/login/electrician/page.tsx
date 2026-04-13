import { LoginForm } from '@/components/auth/login-form'
import { HardHat } from 'lucide-react'

export default function ContractorLoginPage() {
  return (
    <LoginForm
      title="施工パートナーログイン"
      description="施工パートナー様専用ログイン"
      expectedRole="electrician"
      icon={<HardHat className="h-8 w-8 text-white" />}
      themeColor="yellow"
      testAccounts={[
        { email: 'sato@kanto-densetsu.com', label: '関東電設' },
        { email: 'honda@kansai-denko.com', label: '関西電工' },
      ]}
    />
  )
}
