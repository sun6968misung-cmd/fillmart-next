'use client';
import { useState, useMemo } from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { CategoryFilter } from './CategoryFilter';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export function ProductGrid({ products, title }: ProductGridProps) {
  const [category, setCategory] = useState('전체');

  const filtered = useMemo(() =>
    category === '전체' ? products : products.filter(p => p.category === category),
  [products, category]);

  return (
    <section className="space-y-4">
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      <CategoryFilter value={category} onChange={setCategory} />
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">해당 카테고리 상품이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
