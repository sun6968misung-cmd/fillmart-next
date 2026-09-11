'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Search, Package, ChevronDown, ChevronUp } from 'lucide-react';
import type { CartItem } from '@/types';
import Link from 'next/link';

interface LookupResult {
  order_key: string;
  status: string;
  items: CartItem[];
  total_amount: number;
  payment_method: string;
  delivery_address: string;
  delivery_memo: string;
  customer_name: string;
  cancelled_items: string[];
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  '주문완료':   'bg-blue-50 text-blue-600 border-blue-100',
  '배송준비중': 'bg-amber-50 text-amber-600 border-amber-100',
  '배송중':     'bg-orange-50 text-orange-600 border-orange-100',
  '배송완료':   'bg-green-50 text-green-600 border-green-100',
  '취소완료':   'bg-gray-100 text-gray-400 border-gray-200',
  '결제대기':   'bg-yellow-50 text-yellow-600 border-yellow-100',
};

function LookupContent() {
  const params = useSearchParams();
  const [orderKey, setOrderKey] = useState(params.get('order_key') ?? '');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [itemsOpen, setItemsOpen] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_key: orderKey.trim(), phone_last4: phoneLast4.trim() }),
      });
      const json = await res.json();

      if (res.status === 429) {
        setError('조회 횟수를 초과했습니다. 5분 후 다시 시도해주세요.');
        return;
      }
      if (!res.ok) {
        setError('주문 정보를 찾을 수 없습니다. 주문번호와 전화번호 끝 4자리를 확인해주세요.');
        return;
      }
      setResult(json as LookupResult);
      setItemsOpen(true);
    } catch {
      setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const cancelled = result?.cancelled_items ?? [];
  const allCancelled = result ? result.items.every(i => cancelled.includes(i.id)) : false;
  const originalTotal = result?.items.reduce((s, i) => s + i.price * i.qty, 0) ?? 0;
  const cancelledAmt = result?.items
    .filter(i => cancelled.includes(i.id))
    .reduce((s, i) => s + i.price * i.qty, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-black text-gray-900">비회원 주문 조회</h1>
          <p className="text-xs text-gray-400 mt-0.5">주문번호와 전화번호 끝 4자리로 조회합니다.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="order_key">주문번호</Label>
                <Input
                  id="order_key"
                  placeholder="pilmart_..."
                  value={orderKey}
                  onChange={e => setOrderKey(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone_last4">전화번호 끝 4자리</Label>
                <Input
                  id="phone_last4"
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="\d{4}"
                  value={phoneLast4}
                  onChange={e => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <Search className="h-4 w-4" />
                {loading ? '조회 중...' : '주문 조회'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Order header */}
            <div className="px-4 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(result.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[result.status] ?? STATUS_STYLE['주문완료']}`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{result.order_key}</p>
              </div>
              <p className={`text-base font-black flex-shrink-0 ${allCancelled ? 'line-through text-gray-300' : 'text-[#1a3d8f]'}`}>
                {formatPrice(result.total_amount)}
              </p>
            </div>

            {/* Item list toggle */}
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => setItemsOpen(p => !p)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  상품 {result.items.length}개
                </span>
                {itemsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {itemsOpen && (
                <div className="divide-y divide-gray-50">
                  {result.items.map(item => {
                    const isCancelled = cancelled.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`px-4 py-3.5 flex items-start gap-3 ${isCancelled ? 'opacity-40' : ''}`}
                      >
                        <div className="w-[56px] h-[56px] rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            : <span className="text-2xl leading-none">{item.emoji || '🛍️'}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.qty}개 · {formatPrice(item.price)} / 개</p>
                          {isCancelled && (
                            <span className={`mt-1 inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE['취소완료']}`}>
                              취소완료
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-bold flex-shrink-0 pt-0.5 ${isCancelled ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                          {formatPrice(item.price * item.qty)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary footer */}
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>결제수단</span><span>{result.payment_method}</span>
              </div>
              {result.delivery_address && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>배송지</span>
                  <span className="text-right max-w-[60%]">{result.delivery_address}</span>
                </div>
              )}
              {result.delivery_memo && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>배송 메모</span><span>{result.delivery_memo}</span>
                </div>
              )}
              {cancelledAmt > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>상품 금액</span><span>{formatPrice(originalTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-400">
                    <span>취소 금액</span><span>– {formatPrice(cancelledAmt)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-800">최종 결제금액</span>
                <span className="text-base font-black text-[#1a3d8f]">
                  {allCancelled ? '0원 (전액 취소)' : formatPrice(result.total_amount)}
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          회원이신가요?{' '}
          <Link href="/auth" className="text-primary underline-offset-2 hover:underline">
            로그인
          </Link>
          {' '}하시면 모든 주문 내역을 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default function LookupPage() {
  return <Suspense><LookupContent /></Suspense>;
}
