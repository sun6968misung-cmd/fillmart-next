import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-3">필마트</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              신선식품 당일배송<br />고객 만족 최우선
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">고객지원</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/notice" className="hover:text-foreground">공지사항</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">자주 묻는 질문</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">고객문의</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">약관</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">주문</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/orders" className="hover:text-foreground">주문내역</Link></li>
              <li><Link href="/wishlist" className="hover:text-foreground">찜 목록</Link></li>
            </ul>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground text-center">© 2026 필마트. All rights reserved.</p>
      </div>
    </footer>
  );
}
