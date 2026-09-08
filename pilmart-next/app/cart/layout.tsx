import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '장바구니 — 필마트',
  description: '담아둔 상품을 확인하고 결제를 진행하세요.',
};
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
