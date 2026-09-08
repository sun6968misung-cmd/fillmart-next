import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '주문 내역 — 필마트',
  description: '나의 주문 내역을 확인하세요.',
};
export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
