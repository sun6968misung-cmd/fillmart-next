'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Package, User, Search, AlignJustify, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

const MEGA_MENU = [
  {
    title: '농수축산',
    items: [
      { label: '야채/채소', value: '야채/채소' },
      { label: '과일', value: '과일' },
      { label: '쌀/잡곡', value: '쌀/잡곡' },
      { label: '축산/계란', value: '축산/계란' },
      { label: '수산/건어물', value: '수산/건어물' },
      { label: '견과', value: '견과' },
    ],
  },
  {
    title: '가공식품',
    items: [
      { label: '고추장/된장/간장류', value: '고추장/된장/간장류' },
      { label: '양념/소스/육수', value: '양념/소스/육수' },
      { label: '식용유/조미료', value: '식용유/조미료' },
      { label: '밀가루/라면/면', value: '밀가루/라면/면' },
      { label: '유제품/냉장/냉동', value: '유제품/냉장/냉동' },
      { label: '캔/통조림', value: '캔/통조림' },
      { label: '김/편의식/반찬', value: '김/편의식/반찬' },
      { label: '생수/음료', value: '생수/음료' },
      { label: '커피믹스/티백', value: '커피믹스/티백' },
      { label: '빵/스낵/안주류', value: '빵/스낵/안주류' },
      { label: '헬스/건강식품', value: '헬스/건강식품' },
      { label: '반려동물용품', value: '반려동물용품' },
    ],
  },
  {
    title: '주방조리용품',
    items: [
      { label: '소모품/일회용품', value: '소모품/일회용품' },
      { label: '조리도구', value: '조리도구' },
      { label: '식기/밀폐용기', value: '식기/밀폐용기' },
      { label: '주전자/프라이팬', value: '주전자/프라이팬' },
      { label: '냄비/솥/찜기', value: '냄비/솥/찜기' },
    ],
  },
  {
    title: '생활용품',
    items: [
      { label: '주방잡화', value: '주방잡화' },
      { label: '욕실잡화', value: '욕실잡화' },
      { label: '생활잡화', value: '생활잡화' },
      { label: '캠핑용품', value: '캠핑용품' },
      { label: '사무/자동차용품', value: '사무/자동차용품' },
    ],
  },
  {
    title: '대용량/박스상품',
    items: [
      { label: '대용량 농산물', value: '대용량 농산물' },
      { label: '대용량 축산물', value: '대용량 축산물' },
      { label: '대용량 수산물', value: '대용량 수산물' },
      { label: '대용량 장류/양념', value: '대용량 장류/양념' },
      { label: '대용량 냉장/냉동', value: '대용량 냉장/냉동' },
      { label: '대용량 가공식품', value: '대용량 가공식품' },
      { label: '대용량 커피/음료', value: '대용량 커피/음료' },
      { label: '대용량 소모품/세제', value: '대용량 소모품/세제' },
      { label: '대용량 식기/도구', value: '대용량 식기/도구' },
    ],
  },
];

export function Navbar() {
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { isLoggedIn, user, logout } = useAuth();
  const [catOpen, setCatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const catRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* Row 1: 공지 바 */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-2 font-medium tracking-wide">
        🚚 오전 주문 시 당일 배송 · 신선식품 직송
      </div>

      {/* Row 2: 로고 + 검색바 + 아이콘 버튼 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="필마트" width={36} height={36} className="rounded" />
            <span className="text-xl font-bold text-primary hidden sm:block">필마트</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="상품을 검색해보세요!"
              className="w-full border border-gray-300 rounded-full px-5 py-2.5 pr-12 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </form>

          <div className="flex items-center gap-5 shrink-0">
            {isLoggedIn ? (
              <Link href="/orders" className="hidden sm:flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary transition-colors">
                <Package className="h-5 w-5" />
                <span className="text-[10px]">주문내역</span>
              </Link>
            ) : (
              <Link href="/auth" className="hidden sm:flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary transition-colors">
                <User className="h-5 w-5" />
                <span className="text-[10px]">로그인</span>
              </Link>
            )}

            <Link href="/wishlist" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary transition-colors">
              <div className="relative">
                <Heart className="h-5 w-5" />
                {wishCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold">{wishCount}</span>
                )}
              </div>
              <span className="text-[10px]">나의 찜</span>
            </Link>

            <Link href="/cart" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-primary transition-colors">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold">{count}</span>
                )}
              </div>
              <span className="text-[10px]">장바구니</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: GNB */}
      <div className="bg-white border-b border-gray-100 relative" ref={catRef}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-11">
          <div className="flex items-center">
            <button
              onClick={() => setCatOpen(v => !v)}
              className={`flex items-center gap-2 font-bold text-sm px-4 h-11 border-r border-gray-200 hover:text-primary transition-colors ${catOpen ? 'text-primary' : ''}`}
            >
              {catOpen ? <X className="h-4 w-4" /> : <AlignJustify className="h-4 w-4" />}
              카테고리
            </button>
            <nav className="flex items-center text-sm font-medium">
              <Link href="/" className="px-4 h-11 flex items-center hover:text-primary transition-colors">홈</Link>
              <Link href="/?cat=이번주특가" className="px-4 h-11 flex items-center text-red-500 font-bold hover:text-red-600">이번주특가</Link>
              <Link href="/notice" className="hidden md:flex px-4 h-11 items-center hover:text-primary transition-colors">공지사항</Link>
              <Link href="/faq" className="hidden md:flex px-4 h-11 items-center hover:text-primary transition-colors">FAQ</Link>
              <Link href="/contact" className="hidden lg:flex px-4 h-11 items-center hover:text-primary transition-colors">고객문의</Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center text-xs text-gray-500 divide-x divide-gray-200">
            {isLoggedIn ? (
              <>
                <span className="px-3 text-gray-700 font-medium">{user?.name}님</span>
                <button onClick={logout} className="px-3 hover:text-primary transition-colors">로그아웃</button>
                <Link href="/orders" className="px-3 hover:text-primary transition-colors">주문내역</Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="px-3 hover:text-primary transition-colors">로그인</Link>
                <Link href="/auth" className="px-3 hover:text-primary transition-colors">회원가입</Link>
              </>
            )}
            <Link href="/contact" className="px-3 hover:text-primary transition-colors">고객센터</Link>
          </div>
        </div>

        {/* 메가메뉴 드롭다운 */}
        {catOpen && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-screen-xl mx-auto w-full px-8 py-6 flex justify-between gap-6">
              {MEGA_MENU.map(group => (
                <div key={group.title}>
                  <h3 className="font-bold text-sm text-gray-900 mb-3 pb-2 border-b border-gray-100">
                    {group.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {group.items.map(item => (
                      <li key={item.value}>
                        <Link
                          href={`/?cat=${encodeURIComponent(item.value)}`}
                          onClick={() => setCatOpen(false)}
                          className="text-sm text-gray-600 hover:text-primary hover:font-medium transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
