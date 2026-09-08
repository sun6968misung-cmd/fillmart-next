import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '나의 찜 — 필마트',
  description: '찜한 상품 목록을 확인하세요.',
};
export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
