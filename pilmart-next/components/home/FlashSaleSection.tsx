'use client';
import { useEffect, useState } from 'react';
import { FlashSaleConfig } from '@/types';
import { KEYS, lsGet } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

const DEFAULT_FLASH_CONFIG: FlashSaleConfig = {
  startHour: 0,
  endHour: 24,
  products: [
    { idx: 0, name: '국내산 삼겹살 500g', emoji: '🥩', price: 9900,  originalPrice: 13900, desc: '국내산 한돈 직송. 두툼하고 쫄깃한 삼겹살.', maxPerCustomer: 0 },
    { idx: 1, name: '계란 30구 특란',      emoji: '🥚', price: 8900,  originalPrice: 10900, desc: '국내산 신선 특란 30구. 단백질 가득.',       maxPerCustomer: 0 },
    { idx: 2, name: '방울토마토 1kg',      emoji: '🍅', price: 4900,  originalPrice: 6900,  desc: '국내산 당도 높은 방울토마토.',              maxPerCustomer: 0 },
    { idx: 3, name: '양파 3kg',            emoji: '🧅', price: 3900,  originalPrice: 5900,  desc: '청정 지역 농가 직송 아삭한 양파.',          maxPerCustomer: 0 },
  ],
};

export function FlashSaleSection() {
  // DEFAULT로 초기화 → SSR/hydration 첫 렌더부터 섹션이 DOM에 존재
  const [config, setConfig] = useState<FlashSaleConfig>(DEFAULT_FLASH_CONFIG);
  const [timeLeft, setTimeLeft] = useState('');
  const { items } = useCart();

  useEffect(() => {
    function applyConfig() {
      const stored = lsGet<FlashSaleConfig | null>(KEYS.flashSale, null);
      const cfg = stored ?? DEFAULT_FLASH_CONFIG;
      setConfig(cfg);
      return cfg;
    }

    applyConfig();
    window.addEventListener('pilmart:store-synced', applyConfig);

    const tick = () => {
      const liveCfg = lsGet<FlashSaleConfig | null>(KEYS.flashSale, null) ?? DEFAULT_FLASH_CONFIG;
      const h = new Date().getHours();
      if (h >= liveCfg.startHour && h < liveCfg.endHour) {
        const end = new Date();
        end.setHours(liveCfg.endHour, 0, 0, 0);
        const diff = end.getTime() - Date.now();
        const hh = Math.floor(diff / 3600000);
        const mm = Math.floor((diff % 3600000) / 60000);
        const ss = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
        );
      } else {
        setTimeLeft('');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      window.removeEventListener('pilmart:store-synced', applyConfig);
    };
  }, []);

  const h = new Date().getHours();
  const active = h >= config.startHour && h < config.endHour;

  if (config.products.length === 0 || !active) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-flash fill-flash" />
          <h2 className="text-xl font-bold">오늘만 특가</h2>
        </div>
        {timeLeft && (
          <Badge className="bg-flash text-flash-foreground animate-pulse">{timeLeft} 남음</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {config.products.map((fp, idx) => {
          const cartQty = items.find(i => i.id === `flash${idx}`)?.qty ?? 0;
          const hasLimit = fp.maxPerCustomer > 0;
          const limitReached = hasLimit && cartQty >= fp.maxPerCustomer;

          return (
            <Card key={idx} className="overflow-hidden border-flash/40">
              <Link href={`/flash-product/${idx}`} className="block aspect-square bg-muted flex items-center justify-center text-4xl">
                {fp.imageUrl
                  ? <img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" />
                  : <span>{fp.emoji || '⚡'}</span>
                }
              </Link>
              <CardContent className="p-3 space-y-2">
                <Link href={`/flash-product/${idx}`} className="block text-sm font-medium line-clamp-2 hover:underline">{fp.name}</Link>
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-destructive">{formatPrice(fp.price)}</span>
                  {fp.originalPrice > 0 && (
                    <span className="text-xs line-through text-muted-foreground">{formatPrice(fp.originalPrice)}</span>
                  )}
                </div>
                {limitReached ? (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    최대 수량 초과
                  </Button>
                ) : (
                  <Link href={`/flash-product/${idx}`}>
                    <Button size="sm" className="w-full">구매하기</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
