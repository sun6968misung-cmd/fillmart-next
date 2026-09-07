'use client';
import { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useTossPayment } from '@/hooks/useTossPayment';
import { KEYS, lsSet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, Banknote, Handshake, Search } from 'lucide-react';

declare global {
  interface Window {
    daum: {
      Postcode: new (opts: { oncomplete: (data: { zonecode: string; roadAddress: string }) => void }) => { open: () => void };
    };
  }
}

const METHODS = [
  { value: '카드', label: '온라인 카드', icon: CreditCard, toss: true },
  { value: '계좌이체', label: '온라인 계좌이체', icon: Banknote, toss: true },
  { value: 'meet-card', label: '만나서 카드결제', icon: CreditCard, toss: false },
  { value: 'meet-cash', label: '만나서 현금결제', icon: Handshake, toss: false },
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { requestPayment } = useTossPayment();
  const router = useRouter();

  const [method, setMethod] = useState('카드');
  const [zonecode, setZonecode] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const address = roadAddress
    ? `(${zonecode}) ${roadAddress}${detailAddress ? ' ' + detailAddress : ''}`
    : '';

  function openAddressSearch() {
    new window.daum.Postcode({
      oncomplete(data) {
        setZonecode(data.zonecode);
        setRoadAddress(data.roadAddress);
      },
    }).open();
  }
  const orderId = useMemo(() => `pilmart_${Date.now()}`, []);

  useEffect(() => {
    if (items.length === 0) router.push('/');
  }, [items.length, router]);

  if (items.length === 0) return null;

  const handlePay = async () => {
    if (!address.trim()) { toast.error('배송지를 입력해주세요.'); return; }
    if (total < 100000) {
      toast.error(`최소 주문금액은 100,000원입니다. ${(100000 - total).toLocaleString('ko-KR')}원 더 담아주세요.`);
      return;
    }
    setLoading(true);

    const pendingOrder = {
      orderId,
      items,
      total,
      method,
      createdAt: Date.now(),
      address,
      memo,
      customerName: user?.name,
    };
    lsSet(KEYS.pendingOrder, pendingOrder);

    const selectedMethod = METHODS.find(m => m.value === method)!;

    if (!selectedMethod.toss) {
      router.push(`/success?method=${method}&orderId=${orderId}&amount=${total}`);
      return;
    }

    try {
      await requestPayment(method, {
        amount: total,
        orderId,
        orderName: `필마트 주문 (${items.length}개 상품)`,
        customerName: user?.name ?? '고객',
      });
    } catch {
      toast.error('결제가 취소되었습니다.');
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">결제</h1>

      <Card>
        <CardHeader><CardTitle>주문 상품 ({items.length}개)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} × {item.qty}</span>
              <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>합계</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>배송 정보</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>배송지 주소</Label>
            <div className="flex gap-2">
              <Input readOnly placeholder="우편번호" value={zonecode} className="w-32 bg-gray-50 cursor-default" />
              <Button type="button" variant="outline" onClick={openAddressSearch} className="shrink-0 gap-1.5">
                <Search className="h-4 w-4" />
                주소 찾기
              </Button>
            </div>
            <Input readOnly placeholder="도로명 주소" value={roadAddress} className="bg-gray-50 cursor-default" />
            <Input
              id="detail"
              placeholder="상세 주소 (동/호수 등)"
              value={detailAddress}
              onChange={e => setDetailAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">배송 메모 (선택)</Label>
            <Input id="memo" placeholder="문 앞에 놓아주세요" value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>결제 수단</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={method} onValueChange={setMethod} className="space-y-3">
            {METHODS.map(m => (
              <Label key={m.value} htmlFor={m.value}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value={m.value} id={m.value} />
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <span>{m.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handlePay} disabled={loading}>
        {loading ? '처리 중...' : `${formatPrice(total)} 결제하기`}
      </Button>
    </div>
    </>
  );
}
