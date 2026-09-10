'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { KEYS, lsGet } from '@/lib/storage';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const METHOD: Record<string, string> = {
  카드: '온라인 카드', 계좌이체: '온라인 계좌이체',
  'meet-card': '만나서(카드)', 'meet-cash': '만나서(현금)',
};
const STATUS_STYLE: Record<string, string> = {
  '주문완료':   'bg-blue-50 text-blue-600',
  '배송준비중': 'bg-amber-50 text-amber-600',
  '배송중':     'bg-orange-50 text-orange-600',
  '배송완료':   'bg-green-50 text-green-600',
  '취소완료':   'bg-gray-100 text-gray-400',
};

function orderStatusLabel(o: Order): string {
  const cancelled = o.cancelledItems ?? [];
  if (o.items.every(i => cancelled.includes(i.id))) return '취소완료';
  return o.orderStatus ?? '주문완료';
}

export default function MemberDayDetailPage({ params }: { params: Promise<{ phone: string; date: string }> }) {
  const { phone, date } = use(params);
  const decodedPhone = decodeURIComponent(phone);
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [memberName, setMemberName] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [y, m, d] = date.split('-');
  const dateLabel = `${parseInt(m)}월 ${parseInt(d)}일`;
  const fullLabel = `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => { if (r.ok) setAuthed(true); else router.replace('/admin'); })
      .finally(() => setAuthChecked(true));
  }, [router]);

  useEffect(() => {
    if (!authChecked || !authed) return;

    const users = lsGet<{ phone: string; name: string }[]>(KEYS.users, []);
    const found = users.find(u => u.phone === decodedPhone);
    if (found) setMemberName(found.name);

    const allOrders = lsGet<Order[]>(KEYS.orders, []);
    const dayOrders = allOrders.filter(o => {
      if (o.customerPhone !== decodedPhone) return false;
      const dt = new Date(o.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      return key === date;
    }).sort((a, b) => b.createdAt - a.createdAt);

    setOrders(dayOrders);
    if (dayOrders.length > 0) setExpanded({ [dayOrders[0].orderId]: true });
  }, [authChecked, authed, decodedPhone, date, router]);

  const dayTotal = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="fixed inset-0 z-[9999] flex bg-gray-50">
      <AdminSidebar activeTab="members" />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-800">{dateLabel} 주문 상세</h1>
              <p className="text-xs text-gray-400 mt-0.5">{memberName}</p>
            </div>
          </div>
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />관리자
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">
            {/* 일 요약 */}
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{fullLabel}</p>
                <p className="text-xs text-gray-400 mt-0.5">주문 {orders.length}건</p>
              </div>
              <p className="text-xl font-black text-gray-800">{formatPrice(dayTotal)}</p>
            </div>

            {/* 주문 목록 */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-sm text-gray-400">주문 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const isOpen = !!expanded[order.orderId];
                  const statusLabel = orderStatusLabel(order);
                  const cancelled = order.cancelledItems ?? [];
                  const time = new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={order.orderId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [order.orderId]: !isOpen }))}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[statusLabel] ?? 'bg-gray-100 text-gray-500'}`}>
                              {statusLabel}
                            </span>
                            <span className="text-xs text-gray-400">{time}</span>
                          </div>
                          <p className="text-xs font-mono text-gray-400">{order.orderId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800">{formatPrice(order.total)}</p>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-300" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-50 px-5 pb-4">
                          <div className="flex justify-between text-xs text-gray-400 py-3 border-b border-gray-50">
                            <span>결제수단</span>
                            <span>{METHOD[order.method] ?? order.method}</span>
                          </div>
                          <div className="space-y-2 pt-3">
                            {order.items.map(item => {
                              const isCancelled = cancelled.includes(item.id);
                              return (
                                <div key={item.id} className={`flex justify-between text-sm ${isCancelled ? 'opacity-40 line-through' : ''}`}>
                                  <span className="text-gray-700">{item.name} × {item.qty}</span>
                                  <span className="font-medium text-gray-800">{formatPrice(item.price * item.qty)}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-sm font-bold text-gray-800 pt-3 mt-2 border-t border-gray-100">
                            <span>합계</span>
                            <span>{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
