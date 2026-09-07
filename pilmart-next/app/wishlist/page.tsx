'use client';
import { useWishlist } from '@/hooks/useWishlist';
import { getProducts } from '@/lib/products';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { ids } = useWishlist();
  const all = getProducts();
  const products = all.filter(p => ids.includes(p.id));

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">찜 목록</h1>
        <p className="text-muted-foreground">찜한 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">찜 목록 ({products.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
