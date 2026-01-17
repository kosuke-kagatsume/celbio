import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(['member']);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
