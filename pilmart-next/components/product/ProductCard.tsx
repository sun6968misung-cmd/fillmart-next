'use client';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/products';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const img = getProductImage(product.id);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">{product.emoji}</div>
          )}
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-destructive">{discount}%</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            onClick={e => { e.preventDefault(); toggle(product.id); }}
          >
            <Heart className={`h-4 w-4 ${has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </Link>
      <CardContent className="p-3 space-y-2">
        <Link href={`/product/${product.id}`}>
          <p className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">{product.name}</p>
        </Link>
        <p className="text-xs text-muted-foreground">{product.unit} · {product.origin}</p>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
        <Button
          className="w-full"
          size="sm"
          onClick={() => addItem(product)}
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          담기
        </Button>
      </CardContent>
    </Card>
  );
}
