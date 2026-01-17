import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(['partner']);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
