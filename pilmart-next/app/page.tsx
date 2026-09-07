'use client';
import { HeroBanner } from '@/components/home/HeroBanner';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getProducts } from '@/lib/products';

export default function HomePage() {
  const products = getProducts();
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <HeroBanner />
      <FlashSaleSection />
      <div id="products">
        <ProductGrid products={products} title="전체 상품" />
      </div>
    </div>
  );
}
