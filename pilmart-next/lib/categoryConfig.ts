export type CategoryConfig = {
  slug: string;
  category: string;
  bg: string;
  badge: string;
  title: string;
  subtitle: string;
  imgSrc: string;
  badgeColor: string;
};

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    slug: 'vegetables',
    category: '야채/채소',
    bg: '#f5ede0',
    badge: '🥬 이번주특가',
    title: '신선한 야채·과일을\n농가에서 직송',
    subtitle: '산지 직거래로 더 신선하게, 더 저렴하게',
    imgSrc: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1280&h=380&q=80',
    badgeColor: '#eb3800',
  },
  {
    slug: 'sauce',
    category: '고추장/된장/간장류',
    bg: '#fef3e2',
    badge: '🌶️ 양념/소스 특가',
    title: '가게·업소용\n소스·양념 한정 할인',
    subtitle: '고추장·된장·간장부터 업소용 대용량까지',
    imgSrc: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1280&h=380&q=80',
    badgeColor: '#d97706',
  },
  {
    slug: 'meat',
    category: '축산/계란',
    bg: '#fce8e6',
    badge: '🥩 축산/계란',
    title: '국내산 한우·삼겹살\n당일 직송',
    subtitle: '냉장 상태 그대로 오늘 주문, 오늘 배송',
    imgSrc: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1280&h=380&q=80',
    badgeColor: '#dc2626',
  },
  {
    slug: 'seafood',
    category: '수산/건어물',
    bg: '#e0f0f8',
    badge: '🐟 수산/건어물',
    title: '싱싱한 수산물\n산지 당일 직송',
    subtitle: '오전 주문 시 당일 오후 배송 보장',
    imgSrc: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1280&h=380&q=80',
    badgeColor: '#0284c7',
  },
  {
    slug: 'grain',
    category: '쌀/잡곡',
    bg: '#e8f5e9',
    badge: '🌾 쌀/잡곡',
    title: '햇쌀·잡곡\n대용량 특가',
    subtitle: '충남 당진 농협 직송 햇쌀, 지금 특가 중',
    imgSrc: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1280&h=380&q=80',
    badgeColor: '#16a34a',
  },
];

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return CATEGORY_CONFIGS.find(c => c.slug === slug);
}
