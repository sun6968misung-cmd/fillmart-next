'use client';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { NoticePreview } from '@/components/home/NoticePreview';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts } from '@/lib/products';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'discount';

const PRICE_RANGES = [
  { label: '전체', min: 0, max: Infinity },
  { label: '5,000원 이하', min: 0, max: 5000 },
  { label: '5,000 ~ 10,000원', min: 5000, max: 10000 },
  { label: '10,000 ~ 20,000원', min: 10000, max: 20000 },
  { label: '20,000원 이상', min: 20000, max: Infinity },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: '추천순' },
  { key: 'price-asc', label: '낮은가격순' },
  { key: 'price-desc', label: '높은가격순' },
  { key: 'discount', label: '할인율순' },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const cat = searchParams.get('cat') ?? '';
  const isFiltered = !!cat && cat !== '전체';

  const [sort, setSort] = useState<SortKey>('recommended');
  const [priceIdx, setPriceIdx] = useState(0);
  const [onlyDiscount, setOnlyDiscount] = useState(false);

  useEffect(() => {
    setSort('recommended');
    setPriceIdx(0);
    setOnlyDiscount(false);
  }, [cat]);

  const [productRev, setProductRev] = useState(0);
  useEffect(() => {
    const handler = () => setProductRev(r => r + 1);
    window.addEventListener('pilmart:products-changed', handler);
    return () => window.removeEventListener('pilmart:products-changed', handler);
  }, []);
  const allProducts = useMemo(() => getProducts(), [productRev]);

  // Base products for current category (before filters)
  const baseProducts = useMemo(() => {
    if (!isFiltered) return allProducts;
    if (cat === '이번주특가') return allProducts.filter(p => p.section === 'sale');
    return allProducts.filter(p => p.category === cat);
  }, [allProducts, isFiltered, cat]);

  const discountTotal = useMemo(
    () => baseProducts.filter(p => p.originalPrice > p.price).length,
    [baseProducts],
  );

  const filteredProducts = useMemo(() => {
    if (!isFiltered) return allProducts;
    const { min, max } = PRICE_RANGES[priceIdx];
    let items = baseProducts.filter(p => p.price >= min && p.price <= max);
    if (onlyDiscount) items = items.filter(p => p.originalPrice > p.price);
    if (sort === 'price-asc') return [...items].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...items].sort((a, b) => b.price - a.price);
    if (sort === 'discount') return [...items].sort(
      (a, b) => (b.originalPrice - b.price) / b.originalPrice - (a.originalPrice - a.price) / a.originalPrice,
    );
    return items;
  }, [allProducts, isFiltered, baseProducts, cat, sort, priceIdx, onlyDiscount]);

  if (isFiltered) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-4 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
          <Link href="/" className="hover:text-primary transition-colors">홈</Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <span className="text-gray-800 font-medium">{cat}</span>
        </div>

        {/* 모바일 필터 버튼 */}
        <div className="sm:hidden mb-4">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="sm" className="flex items-center gap-2" />}>
              <SlidersHorizontal className="h-4 w-4" />
              필터
            </SheetTrigger>
            <SheetContent side="left" className="w-64 text-sm">
              <SheetHeader>
                <SheetTitle>필터</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                {/* 카테고리 */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">카테고리</h3>
                  <ul className="space-y-1.5">
                    <li>
                      <button onClick={() => { setPriceIdx(0); setOnlyDiscount(false); }} className="text-gray-500 hover:text-primary transition-colors">
                        전체({baseProducts.length})
                      </button>
                    </li>
                    <li className="text-primary font-bold">{cat}({baseProducts.length})</li>
                  </ul>
                </div>
                {/* 혜택 */}
                {discountTotal > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">혜택</h3>
                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-primary transition-colors">
                      <input type="checkbox" checked={onlyDiscount} onChange={e => setOnlyDiscount(e.target.checked)} className="accent-primary" />
                      할인상품({discountTotal})
                    </label>
                  </div>
                )}
                {/* 가격 */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">가격</h3>
                  <ul className="space-y-1.5">
                    {PRICE_RANGES.map((r, i) => (
                      <li key={i}>
                        <button
                          onClick={() => setPriceIdx(i)}
                          className={`transition-colors ${priceIdx === i ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary'}`}
                        >
                          {r.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-7">
          {/* ── 왼쪽 필터 사이드바 (장보자 스타일) ── */}
          <aside className="w-44 shrink-0 hidden sm:block text-sm">

            {/* 카테고리 */}
            <div className="mb-5">
              <h3 className="font-bold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">
                카테고리
              </h3>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => { setPriceIdx(0); setOnlyDiscount(false); }}
                    className="text-gray-500 hover:text-primary transition-colors"
                  >
                    전체({baseProducts.length})
                  </button>
                </li>
                <li className="text-primary font-bold">{cat}({baseProducts.length})</li>
              </ul>
            </div>

            {/* 혜택 */}
            {discountTotal > 0 && (
              <div className="mb-5">
                <h3 className="font-bold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">
                  혜택
                </h3>
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={onlyDiscount}
                    onChange={e => setOnlyDiscount(e.target.checked)}
                    className="accent-primary"
                  />
                  할인상품({discountTotal})
                </label>
              </div>
            )}

            {/* 가격 */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">
                가격
              </h3>
              <ul className="space-y-1.5">
                {PRICE_RANGES.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setPriceIdx(i)}
                      className={`transition-colors ${
                        priceIdx === i
                          ? 'text-primary font-bold'
                          : 'text-gray-600 hover:text-primary'
                      }`}
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── 메인 콘텐츠 ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-gray-200">
              <h1 className="text-xl font-extrabold text-gray-900">{cat}</h1>
              <span className="text-sm text-gray-500">
                총 <strong className="text-primary">{filteredProducts.length}</strong>개 상품
              </span>
            </div>

            {/* 정렬 버튼 */}
            <div className="flex mb-5 border border-gray-200 rounded-lg overflow-hidden w-fit text-xs">
              {SORT_OPTIONS.map((opt, i) => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className={`px-3.5 py-2 font-semibold transition-colors ${i > 0 ? 'border-l border-gray-200' : ''} ${
                    sort === opt.key
                      ? 'bg-primary text-white'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <p className="text-4xl mb-3">🛒</p>
                해당 조건에 맞는 상품이 없습니다
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroBanner />
      <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-10">
        <FlashSaleSection />
        <div id="products">
          <ProductGrid products={allProducts} />
        </div>
        <NoticePreview />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-muted-foreground">로딩 중...</div>}>
      <HomeContent />
    </Suspense>
  );
}
