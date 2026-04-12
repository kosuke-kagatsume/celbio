import { requireRole } from '@/lib/auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default async function ElectricianLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(['electrician'])

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
