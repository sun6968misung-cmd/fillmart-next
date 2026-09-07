'use client';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { getProducts, getProductImage } from '@/lib/products';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingCart, Truck, Thermometer, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const products = getProducts();
  const product = products.find(p => p.id === id);
  if (!product) notFound();

  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const img = getProductImage(product.id);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">{product.emoji}</div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Badge variant="outline" className="mb-2">{product.category}</Badge>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-1">{product.unit}</p>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                <Badge className="bg-destructive">{discount}% 할인</Badge>
              </>
            )}
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /><span>원산지: {product.origin}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Thermometer className="h-4 w-4" /><span>보관: {product.storage}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" /><span>오전 주문 시 당일 배송</span>
            </div>
          </div>

          <p className="text-muted-foreground">{product.desc}</p>

          <div className="flex gap-3">
            <Button className="flex-1" size="lg" onClick={() => addItem(product)}>
              <ShoppingCart className="h-5 w-5 mr-2" />
              장바구니 담기
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => toggle(product.id)}
              className={has(product.id) ? 'text-red-500 border-red-200' : ''}
            >
              <Heart className={`h-5 w-5 ${has(product.id) ? 'fill-red-500' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
