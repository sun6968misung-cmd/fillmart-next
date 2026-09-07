'use client';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { KEYS, lsGet } from '@/lib/storage';
import { FlashSaleConfig } from '@/types';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function FlashProductPage({ params }: { params: Promise<{ idx: string }> }) {
  const { idx } = use(params);
  const idxNum = parseInt(idx, 10);
  const config = lsGet<FlashSaleConfig | null>(KEYS.flashSale, null);
  const fp = config?.products[idxNum];
  if (!fp) notFound();

  const { items, addItem } = useCart();
  const cartQty = items.find(i => i.id === `flash${idxNum}`)?.qty ?? 0;

  const hasLimit = fp.maxPerCustomer > 0;
  const limitReached = hasLimit && cartQty >= fp.maxPerCustomer;

  const handleAdd = () => {
    if (limitReached) {
      toast.error(`1인 최대 ${fp.maxPerCustomer}개까지 구매 가능합니다.`);
      return;
    }
    addItem({
      id: `flash${idxNum}`,
      name: fp.name,
      emoji: fp.emoji || '⚡',
      price: fp.price,
      originalPrice: fp.originalPrice,
      section: 'sale',
      origin: '국내산',
      category: '야채/채소',
      storage: '냉장보관',
      unit: '1개',
      desc: fp.desc ?? '',
      imageUrl: fp.imageUrl,
      maxQty: hasLimit ? fp.maxPerCustomer : undefined,
    });
  };

  const discount = fp.originalPrice > 0
    ? Math.round((1 - fp.price / fp.originalPrice) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <h1 className="text-2xl font-bold">오늘만 특가</h1>
          {hasLimit && <Badge variant="destructive">1인 최대 {fp.maxPerCustomer}개</Badge>}
        </div>

        <div className="aspect-square rounded-2xl overflow-hidden bg-muted max-w-sm mx-auto">
          {fp.imageUrl
            ? <img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-8xl">{fp.emoji || '⚡'}</div>
          }
        </div>

        <div>
          <h2 className="text-xl font-bold">{fp.name}</h2>
          {fp.desc && <p className="text-muted-foreground mt-2">{fp.desc}</p>}
        </div>

        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-destructive">{formatPrice(fp.price)}</span>
          {fp.originalPrice > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through">{formatPrice(fp.originalPrice)}</span>
              {discount > 0 && <Badge className="bg-destructive">{discount}%</Badge>}
            </>
          )}
        </div>

        {hasLimit && (
          <p className="text-sm text-muted-foreground">
            1인 최대 {fp.maxPerCustomer}개 · 현재 <span className={limitReached ? 'text-destructive font-bold' : ''}>{cartQty}개</span> 담음
          </p>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleAdd}
          variant={limitReached ? 'outline' : 'destructive'}
          disabled={limitReached}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {limitReached ? `최대 구매 수량 (${fp.maxPerCustomer}개) 초과` : '장바구니 담기'}
        </Button>
      </div>
    </div>
  );
}
