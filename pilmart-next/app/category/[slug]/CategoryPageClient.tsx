'use client';
import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCategoryConfig, CATEGORY_CONFIGS } from '@/lib/categoryConfig';
import { getProducts } from '@/lib/products';
import { ProductCard } from '@/components/product/ProductCard';

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

export function CategoryPageClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const config = getCategoryConfig(slug);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [priceIdx, setPriceIdx] = useState(0);

  const allProducts = useMemo(() => getProducts(), []);
  const products = useMemo(() => {
    if (!config) return [];
    const { min, max } = PRICE_RANGES[priceIdx];
    const filtered = allProducts.filter(p =>
      p.category === config.category && p.price >= min && p.price <= max
    );
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === 'discount') return [...filtered].sort(
      (a, b) => (b.originalPrice - b.price) / b.originalPrice - (a.originalPrice - a.price) / a.originalPrice
    );
    return filtered;
  }, [allProducts, config, sort, priceIdx]);

  if (!config) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">카테고리를 찾을 수 없습니다.</p>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-4 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
        <Link href="/" className="hover:text-primary transition-colors">홈</Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <span className="text-gray-800 font-medium">{config.category}</span>
      </div>

      <div className="flex gap-7">
        {/* ── 왼쪽 사이드바 ── */}
        <aside className="w-40 shrink-0 hidden sm:block">
          <div className="mb-6">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-200">
              카테고리
            </h3>
            <ul className="space-y-0.5">
              {CATEGORY_CONFIGS.map(c => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className={`flex items-center gap-1.5 text-sm py-1.5 px-2 rounded-lg transition-colors ${
                      c.slug === slug
                        ? 'text-primary font-bold bg-primary/5'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base leading-none">{c.badge.split(' ')[0]}</span>
                    <span className="truncate">{c.category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 가격대 필터 */}
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-200">
              가격대
            </h3>
            <ul className="space-y-0.5">
              {PRICE_RANGES.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => setPriceIdx(i)}
                    className={`w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${
                      priceIdx === i
                        ? 'text-primary font-bold bg-primary/5'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
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
            <h1 className="text-xl font-extrabold text-gray-900">{config.category}</h1>
            <span className="text-sm text-gray-500">
              총 <strong className="text-primary">{products.length}</strong>개 상품
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

          {/* 상품 그리드 */}
          {products.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              해당 조건에 맞는 상품이 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
