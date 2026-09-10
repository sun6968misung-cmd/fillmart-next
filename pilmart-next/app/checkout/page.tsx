'use client';
import { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCart, useAuth } from '@/context/StoreProvider';
import { useTossPayment } from '@/hooks/useTossPayment';
import { KEYS, lsSet } from '@/lib/storage';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, Banknote, Handshake, Search, MapPin } from 'lucide-react';

declare global {
  interface Window {
    daum: {
      Postcode: new (opts: { oncomplete: (data: { zonecode: string; roadAddress: string }) => void }) => { open: () => void };
    };
  }
}

const METHODS = [
  { value: '카드',      label: '온라인 카드',     icon: CreditCard, toss: true },
  { value: '계좌이체',  label: '온라인 계좌이체', icon: Banknote,   toss: true },
  { value: 'meet-card', label: '만나서 카드결제', icon: CreditCard, toss: false },
  { value: 'meet-cash', label: '만나서 현금결제', icon: Handshake,  toss: false },
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { requestPayment } = useTossPayment();
  const router = useRouter();

  const [method, setMethod] = useState('카드');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  // 배송지 모드
  const [addressMode, setAddressMode] = useState<'default' | 'new'>('default');
  const [defaultAddress, setDefaultAddress] = useState('');   // 가입 시 등록한 주소

  // 다른 배송지 입력
  const [zonecode, setZonecode] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  const newAddress = roadAddress
    ? `(${zonecode}) ${roadAddress}${detailAddress ? ' ' + detailAddress : ''}`
    : '';

  // 최종 배송지
  const address = addressMode === 'default' ? defaultAddress : newAddress;

  const orderId = useMemo(() => `pilmart_${Date.now()}`, []);

  useEffect(() => {
    if (items.length === 0) router.push('/');
  }, [items.length, router]);

  // 회원 등록 주소 로드
  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (!sbUser) { setAddressMode('new'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', sbUser.id)
        .single();
      if (profile?.address) {
        setDefaultAddress(profile.address);
        setAddressMode('default');
      } else {
        setAddressMode('new');
      }
    })();
  }, []);

  function openAddressSearch() {
    new window.daum.Postcode({
      oncomplete(data) {
        setZonecode(data.zonecode);
        setRoadAddress(data.roadAddress);
        setDetailAddress('');
      },
    }).open();
  }

  if (items.length === 0) return null;

  const handlePay = async () => {
    if (!address.trim()) {
      toast.error(addressMode === 'default' ? '등록된 기본 배송지가 없습니다. 다른 배송지를 입력해주세요.' : '배송지를 입력해주세요.');
      return;
    }
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
      customerPhone: user?.phone,
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

        {/* 주문 상품 */}
        <Card>
          <CardHeader><CardTitle>주문 상품 ({items.length}개)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map(item => {
              const isTax = item.taxType === 'tax';
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    {item.name} × {item.qty}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isTax ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                      {isTax ? '과세' : '면세'}
                    </span>
                  </span>
                  <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
                </div>
              );
            })}
            <Separator />
            {(() => {
              const taxItems  = items.filter(i => i.taxType === 'tax');
              const freeItems = items.filter(i => i.taxType !== 'tax');
              const taxTotal  = taxItems.reduce((s, i) => s + i.price * i.qty, 0);
              const freeTotal = freeItems.reduce((s, i) => s + i.price * i.qty, 0);
              const supplyAmt = Math.round(taxTotal / 1.1);
              const vatAmt    = taxTotal - supplyAmt;
              return (
                <div className="space-y-1 text-xs text-muted-foreground border border-dashed border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50/50">
                  {freeTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"/>면세 금액</span>
                      <span>{formatPrice(freeTotal)}</span>
                    </div>
                  )}
                  {taxTotal > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block"/>과세 공급가액</span>
                        <span>{formatPrice(supplyAmt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 pl-2.5">부가세 (VAT 10%)</span>
                        <span>{formatPrice(vatAmt)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-between font-bold text-lg">
              <span>합계</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 배송 정보 */}
        <Card>
          <CardHeader><CardTitle>배송 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {/* 배송지 선택 탭 */}
            <div>
              <Label className="mb-2 block">배송지 선택</Label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setAddressMode('default')}
                  className={`flex-1 py-2.5 transition-colors ${addressMode === 'default' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  기본 배송지
                </button>
                <button
                  type="button"
                  onClick={() => setAddressMode('new')}
                  className={`flex-1 py-2.5 transition-colors ${addressMode === 'new' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  다른 배송지
                </button>
              </div>
            </div>

            {/* 기본 배송지 */}
            {addressMode === 'default' && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {defaultAddress ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{defaultAddress}</p>
                ) : (
                  <p className="text-sm text-gray-400">등록된 기본 배송지가 없습니다.<br />다른 배송지를 선택해주세요.</p>
                )}
              </div>
            )}

            {/* 다른 배송지 */}
            {addressMode === 'new' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input readOnly placeholder="우편번호" value={zonecode} className="w-32 bg-gray-50 cursor-default" />
                  <Button type="button" variant="outline" onClick={openAddressSearch} className="shrink-0 gap-1.5">
                    <Search className="h-4 w-4" /> 주소 찾기
                  </Button>
                </div>
                <Input readOnly placeholder="도로명 주소" value={roadAddress} className="bg-gray-50 cursor-default" />
                <Input
                  placeholder="상세 주소 (동/호수 등)"
                  value={detailAddress}
                  onChange={e => setDetailAddress(e.target.value)}
                  disabled={!roadAddress}
                />
              </div>
            )}

            {/* 배송 메모 */}
            <div className="space-y-2">
              <Label htmlFor="memo">배송 메모 (선택)</Label>
              <Input id="memo" placeholder="문 앞에 놓아주세요" value={memo} onChange={e => setMemo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* 결제 수단 */}
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
