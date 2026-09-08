import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '결제하기 — 필마트',
  description: '배송지 입력 후 안전하게 결제하세요.',
};
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
