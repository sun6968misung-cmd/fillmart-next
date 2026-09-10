'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingBag, Zap, Bell, Store,
  Settings, Users, ClipboardList, LogOut,
} from 'lucide-react';
import { KEYS, lsGet } from '@/lib/storage';
import { AdminAccount, AdminRole } from '@/types';

const ROLE_LABEL: Record<AdminRole, string> = {
  super: '최고관리자', product: '상품등록관리자', order: '주문관리자',
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: '대시보드' },
  { id: 'orders',    icon: <Package className="h-4 w-4" />,          label: '주문 관리' },
  { id: 'products',  icon: <ShoppingBag className="h-4 w-4" />,      label: '상품 관리' },
  { id: 'deals',     icon: <Zap className="h-4 w-4" />,              label: '오늘만 특가' },
  { id: 'notices',   icon: <Bell className="h-4 w-4" />,             label: '공지사항' },
  { id: 'site',      icon: <Store className="h-4 w-4" />,            label: '사이트 설정' },
  { id: 'members',   icon: <Users className="h-4 w-4" />,            label: '회원 관리' },
  { id: 'account',   icon: <Settings className="h-4 w-4" />,         label: '계정/데이터' },
  { id: 'logs',      icon: <ClipboardList className="h-4 w-4" />,    label: '관리 로그' },
] as const;

type NavId = typeof NAV_ITEMS[number]['id'];

interface Props {
  activeTab?: NavId;
}

export function AdminSidebar({ activeTab = 'members' }: Props) {
  const router = useRouter();
  const [myRole, setMyRole] = useState<AdminRole>('super');
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => r.ok ? r.json() : null)
      .then((data: { username: string; role: AdminRole } | null) => {
        if (!data) return;
        setMyRole(data.role);
        if (data.username !== '__super__') {
          setCurrentAdmin({ username: data.username } as AdminAccount);
        }
      });

    const orders = lsGet<{ orderId: string }[]>(KEYS.orders, []);
    setOrderCount(orders.length);
  }, []);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-xl font-extrabold text-primary">필마트</p>
        <p className="text-xs font-medium mt-1">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
            myRole === 'super'   ? 'bg-blue-100 text-blue-700' :
            myRole === 'product' ? 'bg-green-100 text-green-700' :
                                   'bg-orange-100 text-orange-700'
          }`}>{ROLE_LABEL[myRole]}</span>
          {currentAdmin && <span className="ml-1.5 text-gray-400">{currentAdmin.username}</span>}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(n => (
          <Link
            key={n.id}
            href={`/admin#${n.id}`}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeTab === n.id
                ? 'bg-blue-50 text-primary font-bold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            {n.icon}
            {n.label}
            {n.id === 'orders' && orderCount > 0 && (
              <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {orderCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <Store className="h-4 w-4" /> 쇼핑몰 보기
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}
