import type { Metadata } from 'next';
import { getProducts, getProductImage } from '@/lib/products';
import { ProductPageClient } from './ProductPageClient';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProducts().find(p => p.id === id);

  if (!product) {
    return { title: '상품을 찾을 수 없습니다 — 필마트' };
  }

  const img = getProductImage(product.id);
  return {
    title: `${product.name} — 필마트`,
    description: product.desc
      ? `${product.desc} | ${product.origin} | ${product.unit}`
      : `${product.name} 당일배송 — 필마트`,
    openGraph: {
      title: `${product.name} — 필마트`,
      description: product.desc ?? `${product.name} 당일배송`,
      images: img ? [{ url: img }] : [],
    },
  };
}

export default function ProductPage({ params }: Props) {
  return <ProductPageClient params={params} />;
}
