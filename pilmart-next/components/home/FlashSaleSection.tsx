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

export function FlashSaleSection() {
  const [config, setConfig] = useState<FlashSaleConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [active, setActive] = useState(false);

  useEffect(() => {
    const cfg = lsGet<FlashSaleConfig | null>(KEYS.flashSale, null);
    setConfig(cfg);
    if (!cfg) return;

    const tick = () => {
      const now = new Date();
      const h = now.getHours();
      const isActive = h >= cfg.startHour && h < cfg.endHour;
      setActive(isActive);
      if (isActive) {
        const end = new Date();
        end.setHours(cfg.endHour, 0, 0, 0);
        const diff = end.getTime() - Date.now();
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}분 ${s}초`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!config || !active || config.products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-xl font-bold">플래시 세일</h2>
        </div>
        <Badge variant="destructive" className="animate-pulse">{timeLeft} 남음</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {config.products.map((fp, idx) => (
          <Card key={idx} className="overflow-hidden border-yellow-300">
            <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
              {fp.imageUrl ? <img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" /> : '⚡'}
            </div>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium line-clamp-2">{fp.name}</p>
              <div className="flex gap-2 items-center">
                <span className="font-bold text-destructive">{formatPrice(fp.price)}</span>
                <span className="text-xs line-through text-muted-foreground">{formatPrice(fp.originalPrice)}</span>
              </div>
              <Link href={`/flash-product/${idx}`}>
                <Button size="sm" variant="destructive" className="w-full">구매하기</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
