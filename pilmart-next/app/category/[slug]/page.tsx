import type { Metadata } from 'next';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { CategoryPageClient } from './CategoryPageClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = getCategoryConfig(slug);

  if (!config) {
    return { title: '카테고리 — 필마트' };
  }

  return {
    title: `${config.category} — 필마트`,
    description: `${config.subtitle} | 신선식품 당일배송 필마트`,
    openGraph: {
      title: `${config.category} — 필마트`,
      description: config.subtitle,
      images: [{ url: config.imgSrc }],
    },
  };
}

export default function CategoryPage({ params }: Props) {
  return <CategoryPageClient params={params} />;
}
