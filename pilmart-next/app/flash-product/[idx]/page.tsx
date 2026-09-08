import type { Metadata } from 'next';
import { FlashProductClient } from './FlashProductClient';

export const metadata: Metadata = {
  title: '오늘만 특가 — 필마트',
  description: '필마트의 오늘 하루 한정 특가 상품을 만나보세요.',
};

type Props = { params: Promise<{ idx: string }> };

export default function FlashProductPage({ params }: Props) {
  return <FlashProductClient params={params} />;
}
