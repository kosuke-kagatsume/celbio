'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Building2,
  Factory,
  Package,
  Users,
  Settings,
  MessageSquare,
  BarChart3,
  Banknote,
  Wrench,
  MapPin,
  X,
  Percent,
  Map,
  Wallet,
  HardHat,
  Truck,
  BookOpen,
} from 'lucide-react';
import type { UserRole } from '@/lib/auth';

interface SidebarProps {
  role: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  separator?: boolean;
}

// ===== セリビオ本部 =====
const adminNavItems: NavItem[] = [
  // 業務
  { title: 'ダッシュボード', href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: '案件管理', href: '/admin/projects', icon: <MapPin className="h-5 w-5" /> },
  { title: '見積管理', href: '/admin/quotes', icon: <FileText className="h-5 w-5" /> },
  { title: '発注管理', href: '/admin/orders', icon: <ShoppingCart className="h-5 w-5" /> },
  { title: '請求管理', href: '/admin/invoices', icon: <Receipt className="h-5 w-5" /> },
  { title: '入金管理', href: '/admin/payments', icon: <CreditCard className="h-5 w-5" /> },
  { title: '支払管理', href: '/admin/partner-payments', icon: <Wallet className="h-5 w-5" /> },
  { title: '銀行取引', href: '/admin/bank-transactions', icon: <Banknote className="h-5 w-5" /> },
  // マスタ管理
  { title: '加盟店管理', href: '/admin/members', icon: <Building2 className="h-5 w-5" />, separator: true },
  { title: 'メーカー管理', href: '/admin/partners', icon: <Factory className="h-5 w-5" /> },
  { title: '施工パートナー管理', href: '/admin/contractors', icon: <HardHat className="h-5 w-5" /> },
  { title: '商材管理', href: '/admin/products', icon: <Package className="h-5 w-5" /> },
  { title: 'マージン係数', href: '/admin/margin-rates', icon: <Percent className="h-5 w-5" /> },
  { title: 'エリアマッピング', href: '/admin/area-mappings', icon: <Map className="h-5 w-5" /> },
  { title: 'ユーザー管理', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
  // その他
  { title: 'メッセージ', href: '/admin/messages', icon: <MessageSquare className="h-5 w-5" />, separator: true },
  { title: 'レポート', href: '/admin/reports', icon: <BarChart3 className="h-5 w-5" /> },
  { title: '設定', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
];

// ===== 工務店（加盟店） =====
const memberNavItems: NavItem[] = [
  { title: 'ダッシュボード', href: '/member/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: '案件管理', href: '/member/projects', icon: <MapPin className="h-5 w-5" /> },
  { title: '見積', href: '/member/quotes', icon: <FileText className="h-5 w-5" /> },
  { title: '発注・納品', href: '/member/orders', icon: <Truck className="h-5 w-5" /> },
  { title: '請求書', href: '/member/invoices', icon: <Receipt className="h-5 w-5" /> },
  { title: '入金', href: '/member/payments', icon: <CreditCard className="h-5 w-5" /> },
  { title: '商材カタログ', href: '/member/catalog', icon: <BookOpen className="h-5 w-5" /> },
  { title: 'メッセージ', href: '/member/messages', icon: <MessageSquare className="h-5 w-5" />, separator: true },
  { title: '設定', href: '/member/settings', icon: <Settings className="h-5 w-5" /> },
];

// ===== メーカー =====
const partnerNavItems: NavItem[] = [
  { title: 'ダッシュボード', href: '/partner/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: '見積回答', href: '/partner/quotes', icon: <FileText className="h-5 w-5" /> },
  { title: '受注管理', href: '/partner/orders', icon: <ShoppingCart className="h-5 w-5" /> },
  { title: '請求書', href: '/partner/invoices', icon: <Receipt className="h-5 w-5" /> },
  { title: '入金確認', href: '/partner/payments', icon: <CreditCard className="h-5 w-5" /> },
  { title: '商材管理', href: '/partner/products', icon: <Package className="h-5 w-5" /> },
  { title: 'メッセージ', href: '/partner/messages', icon: <MessageSquare className="h-5 w-5" />, separator: true },
  { title: '設定', href: '/partner/settings', icon: <Settings className="h-5 w-5" /> },
];

// ===== 施工パートナー =====
const contractorNavItems: NavItem[] = [
  { title: 'ダッシュボード', href: '/electrician/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: '施工管理', href: '/electrician/orders', icon: <Wrench className="h-5 w-5" /> },
  { title: '請求書', href: '/electrician/invoices', icon: <Receipt className="h-5 w-5" /> },
  { title: '入金確認', href: '/electrician/payments', icon: <CreditCard className="h-5 w-5" /> },
  { title: '担当エリア', href: '/electrician/area', icon: <MapPin className="h-5 w-5" /> },
  { title: 'メッセージ', href: '/electrician/messages', icon: <MessageSquare className="h-5 w-5" />, separator: true },
  { title: '設定', href: '/electrician/settings', icon: <Settings className="h-5 w-5" /> },
];

const getNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'admin':
      return adminNavItems;
    case 'member':
      return memberNavItems;
    case 'partner':
      return partnerNavItems;
    case 'electrician':
      return contractorNavItems;
    default:
      return [];
  }
};

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r transition-transform lg:translate-x-0 lg:pt-16',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* モバイル用閉じるボタン */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b">
          <span className="font-semibold text-lg">メニュー</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <div key={item.href}>
                  {item.separator && <div className="border-t my-2" />}
                  <Link href={item.href} onClick={onClose}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      )}
                    >
                      {item.icon}
                      {item.title}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
