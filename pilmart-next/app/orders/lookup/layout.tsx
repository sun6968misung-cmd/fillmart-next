import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '비회원 주문 조회 — 필마트',
  description: '주문번호와 전화번호로 주문 현황을 확인하세요.',
};
export default function LookupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
