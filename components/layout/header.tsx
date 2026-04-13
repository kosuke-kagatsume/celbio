'use client';

import { Building2, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser } from '@/lib/auth';

interface HeaderProps {
  user: AuthUser;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getDashboardLink = () => {
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'member':
        return '/member/dashboard';
      case 'partner':
        return '/partner/dashboard';
      case 'electrician':
        return '/electrician/dashboard';
      default:
        return '/';
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin':
        return 'セリビオ管理者';
      case 'member':
        return user.memberName || '加盟店';
      case 'partner':
        return user.partnerName || 'メーカー';
      case 'electrician':
        return user.partnerName || '施工パートナー';
      default:
        return '';
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'admin':
        return 'bg-purple-100 text-purple-600';
      case 'member':
        return 'bg-blue-100 text-blue-600';
      case 'partner':
        return 'bg-green-100 text-green-600';
      case 'electrician':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href={getDashboardLink()} className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">Celibio</h1>
              <p className="text-xs text-gray-500">セリビオ株式会社</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* 通知 */}
          <NotificationBell rolePrefix={`/${user.role === 'electrician' ? 'electrician' : user.role}`} />

          {/* ユーザーメニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={getRoleColor()}>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                プロフィール
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
