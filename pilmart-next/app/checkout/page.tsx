'use client';
import { useState } from 'react';
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
import { CreditCard, Banknote, Handshake } from 'lucide-react';

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
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    router.push('/');
    return null;
  }

  const orderId = `pilmart_${Date.now()}`;

  const handlePay = async () => {
    if (!address.trim()) { toast.error('배송지를 입력해주세요.'); return; }
    setLoading(true);

    const pendingOrder = {
      orderId,
      items,
      total,
      method,
      createdAt: Date.now(),
      address,
      memo,
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
            <Label htmlFor="address">배송지 주소</Label>
            <Input id="address" placeholder="주소를 입력해주세요" value={address} onChange={e => setAddress(e.target.value)} />
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
  );
}
