'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { KEYS, lsGet } from '@/lib/storage';

interface StoreInfo {
  phone?: string;
  kakaoChannelUrl?: string;
  address?: string;
  [key: string]: unknown;
}

const DEFAULT: StoreInfo = {
  phone: '053-593-8253',
  address: '대구광역시 달성군 다사읍 달구벌대로 858',
};

export function Footer() {
  const [info] = useState<StoreInfo>(() => lsGet<StoreInfo | null>(KEYS.storeInfo, null) ?? DEFAULT);

  const phone = info.phone ?? DEFAULT.phone!;
  const address = info.address ?? DEFAULT.address!;
  const kakaoUrl = info.kakaoChannelUrl ?? null;

  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-3">필마트</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>{address}</p>
              <p>
                <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="hover:text-foreground transition-colors">
                  {phone}
                </a>
              </p>
              <p>매일 08:00~22:00</p>
              {kakaoUrl && (
                <p>
                  <a href={kakaoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    카카오 채널
                  </a>
                </p>
              )}
            </div>
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
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>주식회사 필식자재마트 · 대표 서익준 · 사업자등록번호 702-85-01475</p>
          <p>© 2026 필마트. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
