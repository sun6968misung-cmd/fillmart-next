'use client';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

const CATEGORY_ORDER = [
  '이번주특가',
  '야채/채소', '과일', '쌀/잡곡',
  '축산/계란', '수산/건어물', '유제품/냉장/냉동', '견과',
  '고추장/된장/간장류', '양념/소스/육수', '식용유/조미료',
  '밀가루/라면/면', '캔/통조림', '김/편의식/반찬',
  '생수/음료', '커피믹스/티백', '빵/스낵/안주류',
  '헬스/건강식품', '반려동물용품',
  '소모품/일회용품', '조리도구', '식기/밀폐용기',
  '주방잡화', '욕실잡화', '생활잡화', '캠핑용품', '사무/자동차용품',
  '대용량 농산물', '대용량 축산물', '대용량 수산물',
  '대용량 장류/양념', '대용량 냉장/냉동', '대용량 가공식품',
  '대용량 커피/음료', '대용량 소모품/세제', '대용량 식기/도구',
];

const GRID_LIMIT = 8; // 4열 × 2행

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get('cat') ?? '';

  const filtered = useMemo(() => {
    if (!category || category === '전체') return products;
    if (category === '이번주특가') return products.filter(p => p.section === 'sale');
    return products.filter(p => p.category === category);
  }, [products, category]);

  const grouped = useMemo(() => {
    const sections: Array<{ category: string; products: Product[] }> = [];

    // 이번주특가 먼저
    const saleItems = products.filter(p => p.section === 'sale');
    if (saleItems.length > 0) {
      sections.push({ category: '이번주특가', products: saleItems });
    }

    // 모든 카테고리를 순서대로
    const map = new Map<string, Product[]>();
    products.forEach(p => {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    });

    // CATEGORY_ORDER에 있는 순서대로, 없는 카테고리는 뒤에 추가
    const ordered = CATEGORY_ORDER.filter(c => c !== '이번주특가' && map.has(c));
    const extra = [...map.keys()].filter(c => !CATEGORY_ORDER.includes(c));
    [...ordered, ...extra].forEach(cat => {
      if (map.has(cat)) sections.push({ category: cat, products: map.get(cat)! });
    });

    return sections;
  }, [products]);

  // 카테고리 필터 뷰 (cat 파라미터 있을 때)
  if (category && category !== '전체') {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <h2 className="text-xl font-bold">{category}</h2>
          {category === '이번주특가' && (
            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">SALE</span>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-3">🔍</p>
            <p>해당 카테고리 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    );
  }

  // 전체 카테고리 섹션 뷰 (기본) — 각 카테고리 4×2 = 8개 제한
  return (
    <div className="space-y-14">
      {grouped.map(({ category: cat, products: catProducts }) => {
        const visible = catProducts.slice(0, GRID_LIMIT);
        const hasMore = catProducts.length > GRID_LIMIT;
        return (
          <section key={cat}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{cat}</h2>
                {cat === '이번주특가' && (
                  <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">SALE</span>
                )}
              </div>
              <Link
                href={`/?cat=${encodeURIComponent(cat)}`}
                className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
              >
                더보기 <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {visible.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {hasMore && (
              <div className="mt-4 text-center">
                <Link
                  href={`/?cat=${encodeURIComponent(cat)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/30 px-5 py-2 rounded-full hover:bg-primary/5 transition-colors"
                >
                  {cat} 상품 더보기 ({catProducts.length - GRID_LIMIT}개 더) →
                </Link>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
