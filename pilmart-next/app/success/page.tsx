'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart, useAuth } from '@/context/StoreProvider';
import { KEYS, lsRemove } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

type ConfirmState =
  | { status: 'loading' }
  | { status: 'success'; orderKey: string; totalAmount: number; manual: boolean }
  | { status: 'error'; message: string };

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const executed = useRef(false);
  const [state, setState] = useState<ConfirmState>({ status: 'loading' });

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    const orderId  = params.get('orderId');
    const amount   = Number(params.get('amount') ?? '0');
    const paymentKey = params.get('paymentKey') ?? null;   // meet 결제는 없음

    if (!orderId) { router.replace('/'); return; }

    void (async () => {
      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        const json = await res.json();

        if (res.ok) {
          lsRemove(KEYS.pendingOrder);
          clearCart();
          setState({
            status: 'success',
            orderKey: json.order_key,
            totalAmount: json.total_amount,
            manual: json.status !== '주문완료',
          });
          return;
        }

        const errorMessages: Record<string, string> = {
          amount_mismatch:      '결제 금액이 일치하지 않습니다. 고객센터에 문의해주세요.',
          confirm_in_progress:  '결제 확인이 진행 중입니다. 잠시 후 새로고침해주세요.',
          order_cancelled:      '이미 취소된 주문입니다.',
          order_not_found:      '주문을 찾을 수 없습니다.',
        };
        setState({
          status: 'error',
          message: errorMessages[json.error] ?? '결제 확인 중 오류가 발생했습니다. 고객센터에 문의해주세요.',
        });
      } catch {
        setState({ status: 'error', message: '결제 확인 중 오류가 발생했습니다. 고객센터에 문의해주세요.' });
      }
    })();
  }, [params, router, clearCart]);

  if (state.status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
        <p className="text-muted-foreground">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">결제 확인 실패</h1>
        <p className="text-muted-foreground">{state.message}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button variant="outline">홈으로</Button></Link>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
      <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
      <h1 className="text-2xl font-bold">{state.manual ? '주문 접수 완료' : '결제 완료'}</h1>
      <p className="text-muted-foreground">
        {state.manual ? '주문 금액' : '결제 금액'}: <span className="font-semibold text-foreground">{formatPrice(state.totalAmount)}</span>
      </p>
      <Card>
        <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
          {state.manual ? (
            <p>입금·수령 확인 후 처리됩니다. 확인이 완료되면 별도로 안내드립니다.</p>
          ) : (
            <p>오후 3시 이전 주문 시 당일 배송됩니다.</p>
          )}
          <p className="font-mono text-xs text-gray-500 break-all">주문번호: {state.orderKey}</p>
          {!isLoggedIn && (
            <p className="text-xs text-amber-600 mt-1">
              주문번호를 저장해두세요. 비회원 주문 조회에 필요합니다.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex gap-3 justify-center">
        {isLoggedIn ? (
          <>
            <Link href="/orders"><Button variant="outline">주문내역 보기</Button></Link>
            <Link href="/"><Button>계속 쇼핑하기</Button></Link>
          </>
        ) : (
          <>
            <Link href={`/orders/lookup?order_key=${state.orderKey}`}>
              <Button variant="outline">주문 조회하기</Button>
            </Link>
            <Link href="/"><Button>계속 쇼핑하기</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
