import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '로그인 / 회원가입 — 필마트',
  description: '필마트 회원으로 로그인하거나 새로 가입하세요.',
};
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
