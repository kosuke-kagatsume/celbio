import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CartProvider } from '@/components/catalog/cart-provider';

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(['member']);

  return (
    <DashboardLayout user={user}>
      <CartProvider>{children}</CartProvider>
    </DashboardLayout>
  );
}
