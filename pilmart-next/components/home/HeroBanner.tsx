import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-lg space-y-4">
          <Badge variant="secondary" className="text-primary border-primary/30">🚚 당일배송</Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            신선한 식재료를<br />
            <span className="text-primary">당일배송</span>으로
          </h1>
          <p className="text-muted-foreground text-lg">
            농가 직송 야채·과일부터 신선 육류·수산물까지.<br />
            오전 주문 시 당일 오후 배송.
          </p>
          <div className="flex gap-3">
            <Link href="#products">
              <Button size="lg">지금 쇼핑하기</Button>
            </Link>
            <Link href="/notice">
              <Button variant="outline" size="lg">공지사항</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
