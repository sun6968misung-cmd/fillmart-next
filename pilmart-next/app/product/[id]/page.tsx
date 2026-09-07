'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ChevronRight, Heart, Minus, Plus, Star, Pencil, X, RotateCcw, ImageIcon } from 'lucide-react';
import { getProducts, getProductImage } from '@/lib/products';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import { KEYS, lsGet, lsSet } from '@/lib/storage';
import { ProductOverride } from '@/types';

const CATEGORIES = [
  '야채/채소','과일','쌀/잡곡','축산/계란','수산/건어물','유제품/냉장/냉동','견과',
  '고추장/된장/간장류','양념/소스/육수','식용유/조미료','밀가루/라면/면',
  '캔/통조림','김/편의식/반찬','생수/음료','커피믹스/티백','빵/스낵/안주류',
  '헬스/건강식품','반려동물용품','소모품/일회용품','조리도구','식기/밀폐용기',
  '주방잡화','욕실잡화','생활잡화','캠핑용품','사무/자동차용품',
  '대용량 농산물','대용량 축산물','대용량 수산물','대용량 장류/양념',
  '대용량 냉장/냉동','대용량 가공식품','대용량 커피/음료','대용량 소모품/세제','대용량 식기/도구',
];

type TabId = 'info' | 'review' | 'shipping';

const MOCK_REVIEWS = [
  { id: 1, rating: 5, text: '신선하고 품질이 좋아요. 배송도 빠르고 포장도 꼼꼼하게 되어 있었어요!', date: '2026.08.21', name: '김*영' },
  { id: 2, rating: 5, text: '좋아요. 재구매 의사 있습니다.', date: '2026.07.15', name: '이*준' },
  { id: 3, rating: 4, text: '전반적으로 만족합니다. 다음에도 구매할게요.', date: '2026.06.30', name: '박*수' },
  { id: 4, rating: 5, text: '품질 대비 가격이 합리적이에요. 자주 이용할 것 같아요.', date: '2026.05.12', name: '최*희' },
  { id: 5, rating: 3, text: '보통이에요. 기대했던 것보다는 조금 아쉬웠습니다.', date: '2026.04.08', name: '정*민' },
];

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const products = getProducts();
  const found = products.find(p => p.id === id);
  if (!found) notFound();
  const product = found!;

  const { addItem, updateQty } = useCart();
  const { has, toggle } = useWishlist();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const [isAdmin, setIsAdmin] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: product.name, price: String(product.price), original: String(product.originalPrice),
    category: product.category, imageUrl: '', desc: product.desc ?? '',
    unit: product.unit, origin: product.origin, storage: product.storage,
  });

  useEffect(() => {
    setIsAdmin(lsGet<boolean>(KEYS.adminActive, false));
    const ov = lsGet<Record<string, ProductOverride>>(KEYS.products, {})[product.id] ?? {};
    setEditData(d => ({ ...d, imageUrl: ov.imageUrl ?? '' }));
  }, [product.id]);

  function saveProductEdit() {
    const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
    overrides[product.id] = {
      name: editData.name, price: Number(editData.price), originalPrice: Number(editData.original),
      imageUrl: editData.imageUrl || undefined, category: editData.category,
      desc: editData.desc, unit: editData.unit, origin: editData.origin, storage: editData.storage,
    };
    lsSet(KEYS.products, overrides);
    setEditOpen(false);
    router.refresh();
  }

  function resetProductEdit() {
    const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
    delete overrides[product.id];
    lsSet(KEYS.products, overrides);
    setEditOpen(false);
    router.refresh();
  }

  const img = getProductImage(product.id);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const wished = has(product.id);
  const points = Math.floor(product.price * 0.01);

  const CROSS_CATEGORY: Record<string, string[]> = {
    '축산/계란':       ['야채/채소', '라면/면류', '캔/통조림'],
    '야채/채소':       ['축산/계란', '수산/건어물', '유제품/냉장/냉동'],
    '과일':           ['유제품/냉장/냉동', '야채/채소'],
    '라면/면류':       ['축산/계란', '야채/채소', '캔/통조림'],
    '수산/건어물':     ['야채/채소', '캔/통조림', '라면/면류'],
    '유제품/냉장/냉동': ['과일', '야채/채소', '축산/계란'],
    '캔/통조림':       ['라면/면류', '수산/건어물', '야채/채소'],
  };
  const crossCats = CROSS_CATEGORY[product.category] ?? [];
  const related = products
    .filter(p => crossCats.includes(p.category) && p.id !== product.id)
    .slice(0, 8);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'info', label: '상품정보' },
    { id: 'review', label: `상품평 (${MOCK_REVIEWS.length})` },
    { id: 'shipping', label: '배송/교환/반품 안내' },
  ];

  function handleAddToCart() {
    if (!isLoggedIn) { router.push('/auth'); return; }
    addItem(product);
    if (qty > 1) updateQty(product.id, qty - 1);
  }

  function handleToggleWishlist() {
    if (!isLoggedIn) { router.push('/auth'); return; }
    toggle(product.id);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 브레드크럼 */}
      <div className="border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-1 text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-700 transition-colors">홈</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/?cat=${encodeURIComponent(product.category)}`} className="hover:text-gray-700 transition-colors">
            {product.category}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
          {isAdmin && (
            <button onClick={() => setEditOpen(true)}
              className="ml-auto flex items-center gap-1 bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors shrink-0">
              <Pencil className="h-2.5 w-2.5" /> 관리자 편집
            </button>
          )}
        </div>
      </div>

      {/* 관리자 편집 모달 */}
      {editOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-800">상품 수정</h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* 이미지 */}
              <div className="flex gap-4 items-start">
                <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  {(editData.imageUrl || img) ? (
                    <img src={editData.imageUrl || img} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{product.emoji}</div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">이미지 URL</label>
                  <div className="flex gap-2">
                    <input value={editData.imageUrl} onChange={e => setEditData(d => ({ ...d, imageUrl: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    {editData.imageUrl && (
                      <button onClick={() => setEditData(d => ({ ...d, imageUrl: '' }))} className="text-gray-400 hover:text-red-500 px-2">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> 비우면 기본 이미지로 복원됩니다
                  </p>
                </div>
              </div>
              {/* 상품명 + 카테고리 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">상품명</label>
                  <input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">카테고리</label>
                  <select value={editData.category} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {/* 가격 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">판매가 (원)</label>
                  <input type="number" value={editData.price} onChange={e => setEditData(d => ({ ...d, price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-right" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">정가 (원)</label>
                  <input type="number" value={editData.original} onChange={e => setEditData(d => ({ ...d, original: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-right" />
                </div>
              </div>
              {/* 단위/원산지/보관 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">규격/단위</label>
                  <input value={editData.unit} onChange={e => setEditData(d => ({ ...d, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">원산지</label>
                  <input value={editData.origin} onChange={e => setEditData(d => ({ ...d, origin: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 block">보관방법</label>
                  <input value={editData.storage} onChange={e => setEditData(d => ({ ...d, storage: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              {/* 설명 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">상품 설명</label>
                <textarea value={editData.desc} onChange={e => setEditData(d => ({ ...d, desc: e.target.value }))}
                  rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="px-6 pb-6 flex items-center justify-between">
              <button onClick={resetProductEdit}
                className="flex items-center gap-1.5 text-orange-500 text-sm font-medium hover:text-orange-700">
                <RotateCcw className="h-3.5 w-3.5" /> 기본값으로 초기화
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                  취소
                </button>
                <button onClick={saveProductEdit}
                  className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90">
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상품 메인 */}
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* 이미지 */}
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            {img ? (
              <img src={img} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8rem]">{product.emoji}</div>
            )}
          </div>

          {/* 정보 패널 */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">{product.name}</h1>
            <p className="text-sm text-gray-400 mb-3">{product.unit}</p>

            {/* 가격 */}
            {discount > 0 ? (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-primary font-bold text-sm">{discount}%</span>
                  <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice)}</span>
                </div>
                <span className="text-[2rem] font-extrabold text-gray-900">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <p className="text-[2rem] font-extrabold text-gray-900 mb-5">{formatPrice(product.price)}</p>
            )}

            {/* 정보 행 */}
            <div className="border-t border-gray-200 text-sm">
              {/* 적립혜택 */}
              <div className="flex border-b border-gray-100 py-3">
                <span className="w-32 shrink-0 text-gray-500">적립혜택</span>
                <span className="text-gray-700">최대 {points.toLocaleString('ko-KR')}원 적립</span>
              </div>

              {/* 당일배송 무료배송조건 */}
              <div className="flex border-b border-gray-100 py-3">
                <span className="w-32 shrink-0 text-gray-500 leading-snug">
                  당일배송<br />무료배송조건
                </span>
                <div>
                  <p className="text-gray-700">10만원 이상 주문시 <strong>무료배송</strong></p>
                  <span className="mt-1.5 inline-block text-xs text-gray-500 border border-gray-300 rounded px-2 py-0.5">배송안내</span>
                </div>
              </div>

              {/* 원산지 */}
              <div className="flex border-b border-gray-100 py-3">
                <span className="w-32 shrink-0 text-gray-500">원산지</span>
                <span className="text-gray-700">{product.origin}</span>
              </div>

              {/* 보관방법 */}
              <div className="flex border-b border-gray-100 py-3">
                <span className="w-32 shrink-0 text-gray-500">보관방법</span>
                <span className="text-gray-700">{product.storage}</span>
              </div>

              {/* 구매수량 */}
              <div className="flex items-center border-b border-gray-100 py-3">
                <span className="w-32 shrink-0 text-gray-500">구매수량</span>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                  <span className="w-12 h-9 flex items-center justify-center font-bold border-x border-gray-300">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* 총 금액 */}
            <div className="flex justify-end mt-4 mb-4">
              <span className="text-2xl font-extrabold text-primary">{formatPrice(product.price * qty)}</span>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={handleToggleWishlist}
                className={`w-14 h-14 flex items-center justify-center border rounded transition-colors ${
                  wished ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
                aria-label="찜하기"
              >
                <Heart className={`h-5 w-5 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 h-14 border border-gray-300 bg-white text-gray-800 font-bold rounded hover:bg-gray-50 transition-colors"
              >
                장바구니
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 h-14 bg-primary text-white font-bold rounded hover:bg-primary/90 transition-colors"
              >
                바로구매
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 함께 사면 좋은 상품 */}
      {related.length > 0 && (
        <div className="border-t border-gray-100 py-8">
          <div className="max-w-screen-xl mx-auto px-4">
            <h2 className="text-base font-bold mb-4 text-gray-900">함께 사면 좋은 상품</h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {related.map(p => {
                const pImg = getProductImage(p.id);
                const pDiscount = Math.round((1 - p.price / p.originalPrice) * 100);
                return (
                  <Link key={p.id} href={`/product/${p.id}`} className="shrink-0 w-36 group">
                    <div className="aspect-square bg-gray-50 border border-gray-100 rounded overflow-hidden mb-2 relative">
                      {pImg ? (
                        <img
                          src={pImg}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">{p.emoji}</div>
                      )}
                      {pDiscount > 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                          {pDiscount}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2 mb-1 leading-snug">{p.name}</p>
                    <p className="text-sm font-bold text-gray-900">{formatPrice(p.price)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="border-t border-gray-200 sticky top-[120px] bg-white z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex">
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
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        {activeTab === 'info' && (
          <div className="flex flex-col items-center gap-8">
            {/* 상품 이미지 */}
            <div className="w-full max-w-2xl">
              {img ? (
                <img src={img} alt={product.name} className="w-full rounded-lg border border-gray-100" />
              ) : (
                <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-[10rem]">
                  {product.emoji}
                </div>
              )}
            </div>

            {/* 상품 설명 */}
            <div className="w-full max-w-2xl bg-gray-50 rounded-xl p-6 text-sm text-gray-700 space-y-2">
              <p className="text-base font-bold mb-3">{product.name}</p>
              <p>{product.desc}</p>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1.5 text-gray-500">
                <p>• 오전 10시 이전 주문 시 당일 배송 처리됩니다.</p>
                <p>• 신선도가 마음에 들지 않으시면 수령일 24시간 이내 전액 환불해드립니다.</p>
              </div>
            </div>

            {/* 상품 고시정보 */}
            <div className="w-full max-w-2xl">
              <h3 className="text-sm font-bold text-gray-800 mb-3">상품 고시정보</h3>
              <table className="w-full text-sm border-t border-gray-200">
                <tbody>
                  {[
                    ['포장단위별 내용물의 용량(중량), 수량, 크기', product.unit],
                    ['원산지', product.origin],
                    ['보관방법', product.storage],
                    ['소비기한 또는 품질유지기한', '상세페이지 참조'],
                    ['상품구성', product.name],
                    ['소비자상담 관련 전화번호', '고객센터 참조'],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-3 px-4 bg-gray-50 text-gray-500 w-56">{label}</td>
                      <td className="py-3 px-4 text-gray-700">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="max-w-2xl mx-auto">
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
          <div className="max-w-2xl mx-auto space-y-8 text-sm">
            <div>
              <h3 className="font-bold text-base mb-3 pb-2 border-b border-gray-200">배송 안내</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>오전 10시 이전 주문 시 당일 배송 처리됩니다.</li>
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
                <li className="flex gap-2"><span className="text-gray-400 shrink-0">•</span>포장 개봉 후에는 교환/반품이 불가합니다.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
