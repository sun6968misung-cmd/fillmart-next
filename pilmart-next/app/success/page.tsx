'use client';
import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { KEYS, lsGet, lsSet, lsRemove } from '@/lib/storage';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

function SuccessContent() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    const pending = lsGet<(Order & { address?: string; customerName?: string }) | null>(KEYS.pendingOrder, null);
    if (!pending) return;

    const order: Order = {
      orderId: params.get('orderId') ?? pending.orderId,
      items: pending.items,
      total: pending.total,
      method: params.get('method') ?? pending.method,
      createdAt: Date.now(),
      paymentKey: params.get('paymentKey') ?? undefined,
      customerName: pending.customerName,
    };

    const orders = lsGet<Order[]>(KEYS.orders, []);
    lsSet(KEYS.orders, [order, ...orders].slice(0, 30));
    lsRemove(KEYS.pendingOrder);
    clearCart();
  }, [params, clearCart]);

  const amount = params.get('amount');

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
      <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
      <h1 className="text-2xl font-bold">결제 완료</h1>
      {amount && <p className="text-muted-foreground">결제 금액: <span className="font-semibold text-foreground">{formatPrice(Number(amount))}</span></p>}
      <Card><CardContent className="pt-6 text-sm text-muted-foreground">오전 주문 시 당일 오후 배송됩니다.</CardContent></Card>
      <div className="flex gap-3 justify-center">
        <Link href="/orders"><Button variant="outline">주문내역 보기</Button></Link>
        <Link href="/"><Button>계속 쇼핑하기</Button></Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
