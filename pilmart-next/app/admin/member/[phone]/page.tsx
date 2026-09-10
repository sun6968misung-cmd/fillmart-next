'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, ChevronRight } from 'lucide-react';
import { KEYS, lsGet } from '@/lib/storage';
import { formatPrice } from '@/lib/utils';
import { Order, StoredUser } from '@/types';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface DaySummary {
  date: string;
  label: string;
  total: number;
  orderCount: number;
}

const PROVIDER_LABEL: Record<string, string> = { local: '일반', kakao: '카카오', naver: '네이버' };
const PROVIDER_STYLE: Record<string, string> = {
  local: 'bg-gray-100 text-gray-600',
  kakao: 'bg-yellow-100 text-yellow-700',
  naver: 'bg-green-100 text-green-700',
};

function maskPhone(p: string) {
  if (p.length >= 10) return p.slice(0, 3) + '-****-' + p.slice(-4);
  return p;
}

export default function MemberDetailPage({ params }: { params: Promise<{ phone: string }> }) {
  const { phone } = use(params);
  const decodedPhone = decodeURIComponent(phone);
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [member, setMember] = useState<StoredUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => { if (r.ok) setAuthed(true); else router.replace('/admin'); })
      .finally(() => setAuthChecked(true));
  }, [router]);

  useEffect(() => {
    if (!authChecked || !authed) return;

    const users = lsGet<StoredUser[]>(KEYS.users, []);
    const found = users.find(u => u.phone === decodedPhone);
    if (!found) { setNotFound(true); return; }
    setMember(found);

    const orders = lsGet<Order[]>(KEYS.orders, []);
    const mine = orders.filter(o => o.customerPhone === decodedPhone);

    const byDay: Record<string, { total: number; count: number }> = {};
    for (const o of mine) {
      const dt = new Date(o.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      if (!byDay[key]) byDay[key] = { total: 0, count: 0 };
      byDay[key].total += o.total;
      byDay[key].count += 1;
    }

    const summaries: DaySummary[] = Object.entries(byDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, { total, count }]) => {
        const [, m, d] = date.split('-');
        return { date, label: `${parseInt(m)}월 ${parseInt(d)}일`, total, orderCount: count };
      });

    setDays(summaries);
    setTotalSpend(mine.reduce((s, o) => s + o.total, 0));
    setTotalOrders(mine.length);
  }, [authChecked, authed, decodedPhone, router]);

  const provider = member?.provider ?? 'local';

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
              <h1 className="text-lg font-black text-gray-800">회원 상세</h1>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />관리자
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {notFound ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">회원 정보를 찾을 수 없습니다.</p>
            </div>
          ) : !member ? null : (
            <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">
              {/* 회원 정보 카드 */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-gray-800">{member.name}</p>
                    <p className="text-sm font-mono text-gray-500 mt-0.5">{maskPhone(member.phone)}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${PROVIDER_STYLE[provider]}`}>
                    {PROVIDER_LABEL[provider]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xl font-black text-gray-800">{totalOrders}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">총 주문</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xl font-black text-gray-800">{days.length}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">방문 일수</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-lg font-black text-gray-800">{formatPrice(totalSpend)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">누적 결제</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">회원구분</span>
                    {member.userType === 'business' ? (
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">사업자</span>
                    ) : (
                      <span className="text-gray-600">개인</span>
                    )}
                  </div>
                  {member.userType === 'business' && member.businessName && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">상호명</span>
                      <span className="text-gray-700">{member.businessName}</span>
                    </div>
                  )}
                  {member.userType === 'business' && member.businessNo && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">사업자번호</span>
                      <span className="text-gray-700">{member.businessNo}</span>
                    </div>
                  )}
                  {member.userType === 'business' && member.businessType && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">업태</span>
                      <span className="text-gray-700">{member.businessType}</span>
                    </div>
                  )}
                  {member.userType === 'business' && member.businessCategory && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">업종</span>
                      <span className="text-gray-700">{member.businessCategory}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-400">주소</span>
                    <span className="text-gray-700">{member.address || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">가입일</span>
                    <span className="text-gray-600">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 일자별 주문금액 */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 px-1 mb-2">일자별 주문금액</h2>
                {days.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <ShoppingBag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">주문 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {days.map((day, i) => (
                      <button
                        key={day.date}
                        onClick={() => router.push(`/admin/member/${encodeURIComponent(decodedPhone)}/day/${day.date}`)}
                        className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left ${i !== 0 ? 'border-t border-gray-50' : ''}`}
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{day.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">주문 {day.orderCount}건</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800">{formatPrice(day.total)}</p>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
