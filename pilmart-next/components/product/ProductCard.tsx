'use client';
import { Product } from '@/types';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart, useWishlist, useAuth } from '@/context/StoreProvider';
import { formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/products';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const img = getProductImage(product.id);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const wished = has(product.id);

  return (
    <div className="group">
      {/* 썸네일 */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-md mb-2.5">
        <Link href={`/product/${product.id}`}>
          {img ? (
            <img
              src={img}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">{product.emoji}</div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-primary text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-sm leading-tight">
              {discount}%
            </span>
          )}
        </Link>

        {/* 찜 버튼 (우상단 상시 표시) */}
        <button
          onClick={() => { if (!isLoggedIn) { router.push('/auth'); return; } toggle(product.id); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart className={`h-3.5 w-3.5 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>

        {/* 담기 버튼 (hover 시 하단 슬라이드업) */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <button
            onClick={() => { if (!isLoggedIn) { router.push('/auth'); return; } addItem(product); }}
            className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 flex items-center justify-center gap-1.5 text-sm font-bold transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            담기
          </button>
        </div>
      </div>

      {/* 상품 정보 */}
      <Link href={`/product/${product.id}`} className="block">
        <p className="text-sm text-gray-800 line-clamp-2 leading-snug mb-1 hover:text-primary transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-xs text-gray-400">{product.unit} · {product.origin}</p>
          {product.taxType === 'tax'
            ? <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">과세</span>
            : <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">면세</span>
          }
        </div>
        {discount > 0 && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold text-primary">{discount}%</span>
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
          </div>
        )}
        <p className="text-[15px] font-bold text-gray-900">{formatPrice(product.price)}</p>
      </Link>
    </div>
  );
}
