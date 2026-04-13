'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Building2, Factory, HardHat } from 'lucide-react'

const roles = [
  {
    title: 'セリビオ管理者',
    description: '管理システムへログイン',
    href: '/login/admin',
    icon: <Shield className="h-8 w-8" />,
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  {
    title: '加盟店（工務店）',
    description: '見積依頼・発注管理',
    href: '/login/member',
    icon: <Building2 className="h-8 w-8" />,
    bgColor: 'bg-green-50 hover:bg-green-100',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  {
    title: 'メーカー',
    description: '見積回答・受注管理',
    href: '/login/partner',
    icon: <Factory className="h-8 w-8" />,
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  {
    title: '施工パートナー',
    description: '施工管理・完了報告',
    href: '/login/electrician',
    icon: <HardHat className="h-8 w-8" />,
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200',
  },
] as const

export default function LoginSelectorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Celibio Platform</h1>
          <p className="mt-2 text-gray-600">セリビオ株式会社 - 建築資材受発注プラットフォーム</p>
        </div>

        <div className="grid gap-3">
          {roles.map((role) => (
            <Link key={role.href} href={role.href}>
              <Card className={`${role.bgColor} border ${role.borderColor} transition-colors cursor-pointer`}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={role.iconColor}>
                    {role.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
