'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { FlashSaleConfig } from '@/types';
import { useCart } from '@/context/StoreProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ShoppingCart, Star, ChevronLeft } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

type TabId = 'info' | 'review' | 'shipping';

const MOCK_REVIEWS = [
  { id: 1, rating: 5, text: '특가라서 반신반의했는데 품질이 정말 좋아요! 신선도도 완벽합니다.', date: '2026.08.30', name: '김*연' },
  { id: 2, rating: 5, text: '이 가격에 이 퀄리티라니 놀랍네요. 다음 특가도 꼭 노릴게요.', date: '2026.08.22', name: '박*훈' },
  { id: 3, rating: 4, text: '배송이 빠르고 포장도 꼼꼼했어요. 전반적으로 만족합니다.', date: '2026.08.15', name: '이*수' },
  { id: 4, rating: 5, text: '오늘만 특가 항상 챙겨보는데 이번엔 정말 득템했어요!', date: '2026.08.09', name: '최*진' },
  { id: 5, rating: 3, text: '가격 대비 나쁘지 않아요. 기대가 너무 컸을 수도 있어요.', date: '2026.07.28', name: '정*아' },
];

export function FlashProductClient({ params }: { params: Promise<{ idx: string }> }) {
  const { idx } = use(params);
  const idxNum = parseInt(idx, 10);

  const [config, setConfig] = useState<FlashSaleConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const { items, addItem } = useCart();

  useEffect(() => {
    fetch('/api/flash-sale')
      .then(r => r.json())
      .then((data: FlashSaleConfig) => { setConfig(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const fp = config?.products[idxNum];
  const cartQty = items.find(i => i.id === `flash${idxNum}`)?.qty ?? 0;

  const hasLimit = (fp?.maxPerCustomer ?? 0) > 0;
  const limitReached = hasLimit && cartQty >= (fp?.maxPerCustomer ?? 0);

  const handleAdd = () => {
    if (!fp) return;
    if (limitReached) {
      toast.error(`1인 최대 ${fp.maxPerCustomer}개까지 구매 가능합니다.`);
      return;
    }
    addItem({
      id: `flash${idxNum}`,
      name: fp.name,
      emoji: fp.emoji || '⚡',
      price: fp.price,
      originalPrice: fp.originalPrice,
      section: 'sale',
      origin: '국내산',
      category: '야채/채소',
      storage: '냉장보관',
      unit: '1개',
      desc: fp.desc ?? '',
      imageUrl: fp.imageUrl,
      maxQty: hasLimit ? fp.maxPerCustomer : undefined,
    });
  };

  const discount = fp && fp.originalPrice > 0
    ? Math.round((1 - fp.price / fp.originalPrice) * 100)
    : 0;

  const TABS: { id: TabId; label: string }[] = [
    { id: 'info', label: '상품정보' },
    { id: 'review', label: `상품평 (${MOCK_REVIEWS.length})` },
    { id: 'shipping', label: '배송/교환/반품 안내' },
  ];

  /* 로딩 중 */
  if (!loaded) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-40" />
        <div className="aspect-square rounded-2xl bg-gray-100 max-w-sm mx-auto" />
        <div className="h-6 bg-gray-100 rounded w-2/3" />
        <div className="h-10 bg-gray-100 rounded w-1/3" />
        <div className="h-14 bg-gray-100 rounded" />
      </div>
    );
  }

  /* 상품 없음 */
  if (!fp) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-6xl mb-4">⚡</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">특가 상품을 찾을 수 없어요</h1>
        <p className="text-sm text-gray-500 mb-6">해당 특가 상품이 존재하지 않거나 이미 종료되었습니다.</p>
        <Link href="/" className="bg-primary text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-primary/90 transition-colors">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 브레드크럼 */}
      <div className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-3 w-3" />
            홈으로
          </Link>
        </div>
      </div>

      {/* 상단 상품 영역 */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <h1 className="text-2xl font-bold">오늘만 특가</h1>
          {hasLimit && <Badge variant="destructive">1인 최대 {fp.maxPerCustomer}개</Badge>}
        </div>

        <div className="aspect-square rounded-2xl overflow-hidden bg-muted max-w-sm mx-auto">
          {fp.imageUrl
            ? <img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-8xl">{fp.emoji || '⚡'}</div>
          }
        </div>

        <div>
          <h2 className="text-xl font-bold">{fp.name}</h2>
          {fp.desc && <p className="text-muted-foreground mt-2">{fp.desc}</p>}
        </div>

        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-destructive">{formatPrice(fp.price)}</span>
          {fp.originalPrice > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through">{formatPrice(fp.originalPrice)}</span>
              {discount > 0 && <Badge className="bg-destructive">{discount}%</Badge>}
            </>
          )}
        </div>

        {hasLimit && (
          <p className="text-sm text-muted-foreground">
            1인 최대 {fp.maxPerCustomer}개 · 현재{' '}
            <span className={limitReached ? 'text-destructive font-bold' : ''}>{cartQty}개</span> 담음
          </p>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleAdd}
          variant={limitReached ? 'outline' : 'default'}
          disabled={limitReached}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {limitReached ? `최대 구매 수량 (${fp.maxPerCustomer}개) 초과` : '장바구니 담기'}
        </Button>

        {/* 배송 안내 요약 */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
          <p className="font-semibold text-gray-800 mb-2">배송 안내</p>
          <p>• 오전 10시 이전 주문 시 <strong>당일 배송</strong> 처리됩니다.</p>
          <p>• 10만원 이상 주문 시 무료배송</p>
          <p>• 신선도가 마음에 들지 않으시면 수령일 24시간 이내 전액 환불</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-t border-gray-200 sticky top-[120px] bg-white z-10">
        <div className="max-w-2xl mx-auto px-4 flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        {activeTab === 'info' && (
          <div className="space-y-8">
            <div className="rounded-2xl overflow-hidden bg-muted">
              {fp.imageUrl
                ? <img src={fp.imageUrl} alt={fp.name} className="w-full object-cover" />
                : <div className="w-full aspect-square flex items-center justify-center text-[10rem]">{fp.emoji || '⚡'}</div>
              }
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700 space-y-2">
              <p className="text-base font-bold mb-3">{fp.name}</p>
              {fp.desc && <p>{fp.desc}</p>}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1.5 text-gray-500">
                <p>• 오늘 하루만 진행되는 한정 특가 상품입니다.</p>
                <p>• 오후 3시 이전 주문 시 당일 배송 처리됩니다.</p>
                <p>• 신선도가 마음에 들지 않으시면 수령일 24시간 이내 전액 환불해드립니다.</p>
              </div>
            </div>

            <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <p className="font-bold text-yellow-800">오늘만 특가 혜택</p>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1.5">
                {discount > 0 && <li>• 정가 대비 {discount}% 할인된 특별가</li>}
                {hasLimit && <li>• 1인 최대 {fp.maxPerCustomer}개 구매 가능</li>}
                <li>• 오늘 하루만 진행되는 한정 행사</li>
                <li>• 재고 소진 시 조기 마감될 수 있습니다</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3">상품 고시정보</h3>
              <table className="w-full text-sm border-t border-gray-200">
                <tbody>
                  {([
                    ['상품명', fp.name],
                    ['판매가격', `${formatPrice(fp.price)} (오늘만 특가)`],
                    ['행사기간', '오늘 하루 한정'],
                    ['구매제한', hasLimit ? `1인 최대 ${fp.maxPerCustomer}개` : '제한 없음'],
                    ['소비자상담 관련 전화번호', '고객센터 참조'],
                  ] as [string, string][]).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-3 px-4 bg-gray-50 text-gray-500 w-48 align-top">{label}</td>
                      <td className="py-3 px-4 text-gray-700">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            {MOCK_REVIEWS.map(review => (
              <div key={review.id} className="border-b border-gray-100 py-5">
                <div className="flex items-center gap-1 mb-1.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-medium text-gray-700">
                    {review.rating === 5 ? '좋아요' : review.rating >= 4 ? '만족해요' : '보통이에요'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                <p className="text-xs text-gray-400">{review.date} / {review.name}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-8 text-sm">
            <div>
              <h3 className="font-bold text-base mb-3 pb-2 border-b border-gray-200">배송 안내</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>오후 3시 이전 주문 시 당일 배송 처리됩니다.</li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>배송 방법 및 지역에 따라 배송비가 달라질 수 있습니다.</li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>제주 및 도서산간 지역은 추가 배송비가 부과됩니다.</li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>10만원 이상 주문 시 무료배송입니다.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-base mb-3 pb-2 border-b border-gray-200">교환/반품 안내</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>수령 후 24시간 이내에 고객센터로 연락 주시면 교환/반품 처리가 가능합니다.</li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>신선식품의 특성상 단순 변심에 의한 반품은 불가합니다.</li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>상품 불량 또는 오배송의 경우 전액 환불 또는 재배송해드립니다.</li>
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>오늘만 특가 상품은 한정 수량으로 재배송이 어려울 수 있습니다.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
