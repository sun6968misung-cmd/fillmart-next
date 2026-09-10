'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import { createClient } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ChevronDown, ChevronUp, X } from 'lucide-react';

type CancelTarget = { orderId: string; itemId: string | null };

const STATUS_STYLE: Record<string, string> = {
  '주문완료':   'bg-blue-50 text-blue-600 border-blue-100',
  '배송준비중': 'bg-amber-50 text-amber-600 border-amber-100',
  '배송중':     'bg-orange-50 text-orange-600 border-orange-100',
  '배송완료':   'bg-green-50 text-green-600 border-green-100',
  '취소완료':   'bg-gray-100 text-gray-400 border-gray-200',
};

function orderStatus(order: Order): string {
  const cancelled = order.cancelledItems ?? [];
  if (order.items.every(i => cancelled.includes(i.id))) return '취소완료';
  return order.orderStatus ?? '주문완료';
}

export default function OrdersPage() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});
  const [confirm, setConfirm]     = useState<CancelTarget | null>(null);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth?redirect=/orders'); return; }

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!data) return;
      const mapped: Order[] = data.map(row => ({
        orderId:        row.order_key ?? row.id,
        items:          row.items,
        total:          row.total_amount,
        method:         row.payment_method,
        createdAt:      new Date(row.created_at).getTime(),
        paymentKey:     row.payment_key ?? undefined,
        address:        row.delivery_address ?? undefined,
        memo:           row.delivery_memo ?? undefined,
        customerName:   row.customer_name ?? undefined,
        customerPhone:  row.customer_phone ?? undefined,
        orderStatus:    row.status ?? undefined,
        cancelledItems: row.cancelled_items ?? [],
      }));
      setOrders(mapped);
      if (mapped.length > 0) setExpanded({ [mapped[0].orderId]: true });
    })();
  }, []);

  async function doCancel({ orderId, itemId }: CancelTarget) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;
    const toCancel  = itemId ? [itemId] : order.items.map(i => i.id);
    const cancelled = [...new Set([...(order.cancelledItems ?? []), ...toCancel])];
    const newTotal  = order.items
      .filter(i => !cancelled.includes(i.id))
      .reduce((s, i) => s + i.price * i.qty, 0);

    const supabase = createClient();
    await supabase.from('orders')
      .update({ cancelled_items: cancelled, total_amount: newTotal })
      .eq('order_key', orderId);

    setOrders(orders.map(o =>
      o.orderId !== orderId ? o : { ...o, cancelledItems: cancelled, total: newTotal }
    ));
    setConfirm(null);
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <ShoppingBag className="h-14 w-14 text-gray-200" />
        <p className="text-lg font-bold text-gray-800">주문 내역</p>
        <p className="text-sm text-gray-400">아직 주문 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* Cancel confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center">
            <p className="text-base font-bold text-gray-900 mb-1">
              {confirm.itemId ? '상품을 취소하시겠습니까?' : '주문 전체를 취소하시겠습니까?'}
            </p>
            <p className="text-xs text-gray-400 mb-5">취소 후에는 되돌릴 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                아니오
              </button>
              <button
                onClick={() => { void doCancel(confirm); }}
                className="flex-1 py-2.5 rounded-xl bg-[#e8001d] text-white text-sm font-bold hover:bg-red-700 transition-colors"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-lg font-black text-gray-900">주문 · 배송 조회</h1>
            <p className="text-xs text-gray-400 mt-0.5">총 {orders.length}건의 주문</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {orders.map(order => {
            const cancelled     = order.cancelledItems ?? [];
            const isOpen        = expanded[order.orderId] ?? false;
            const status        = orderStatus(order);
            const allCancelled  = order.items.every(i => cancelled.includes(i.id));
            const someActive    = order.items.some(i => !cancelled.includes(i.id));
            const originalTotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
            const cancelledAmt  = order.items
              .filter(i => cancelled.includes(i.id))
              .reduce((s, i) => s + i.price * i.qty, 0);
            const finalTotal    = originalTotal - cancelledAmt;
            const canCancel     = someActive && status !== '배송완료' && status !== '취소완료';
            const date          = new Date(order.createdAt);

            return (
              <div key={order.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order card header */}
                <button
                  onClick={() => setExpanded(p => ({ ...p, [order.orderId]: !p[order.orderId] }))}
                  className="w-full text-left"
                >
                  <div className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">
                            {date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[status] ?? STATUS_STYLE['주문완료']}`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{order.orderId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-base font-black ${allCancelled ? 'line-through text-gray-300' : 'text-[#1a3d8f]'}`}>
                        {formatPrice(finalTotal)}
                      </span>
                      {isOpen
                        ? <ChevronUp className="h-4 w-4 text-gray-300" />
                        : <ChevronDown className="h-4 w-4 text-gray-300" />
                      }
                    </div>
                  </div>
                </button>

                {/* Order body */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    {/* Item list */}
                    <div className="divide-y divide-gray-50">
                      {order.items.map(item => {
                        const isCancelled = cancelled.includes(item.id);
                        const itemStatus  = isCancelled ? '취소완료' : status;
                        const canCancelItem = !isCancelled && canCancel;

                        return (
                          <div
                            key={item.id}
                            className={`px-4 py-3.5 flex items-start gap-3 transition-opacity ${isCancelled ? 'opacity-40' : ''}`}
                          >
                            {/* Thumbnail */}
                            <div className="w-[60px] h-[60px] rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.imageUrl
                                ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                : <span className="text-2xl leading-none">{item.emoji || '🛍️'}</span>
                              }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{item.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{item.qty}개 · {formatPrice(item.price)} / 개</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[itemStatus] ?? STATUS_STYLE['주문완료']}`}>
                                  {itemStatus}
                                </span>
                                {canCancelItem && (
                                  <button
                                    onClick={() => setConfirm({ orderId: order.orderId, itemId: item.id })}
                                    className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2 py-0.5 rounded-full transition-colors"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                    취소
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0 pt-0.5">
                              <p className={`text-sm font-bold ${isCancelled ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                                {formatPrice(item.price * item.qty)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary footer */}
                    <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>결제수단</span>
                        <span>{order.method}</span>
                      </div>
                      {order.customerName && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>주문자</span>
                          <span>{order.customerName}</span>
                        </div>
                      )}
                      {cancelledAmt > 0 && (
                        <>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>상품 금액</span>
                            <span>{formatPrice(originalTotal)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-red-400">
                            <span>취소 금액</span>
                            <span>– {formatPrice(cancelledAmt)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                        <span className="text-sm font-bold text-gray-800">최종 결제금액</span>
                        <span className="text-base font-black text-[#1a3d8f]">
                          {allCancelled ? '0원 (전액 취소)' : formatPrice(finalTotal)}
                        </span>
                      </div>

                      {canCancel && (
                        <button
                          onClick={() => setConfirm({ orderId: order.orderId, itemId: null })}
                          className="w-full mt-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
                        >
                          주문 전체 취소
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
