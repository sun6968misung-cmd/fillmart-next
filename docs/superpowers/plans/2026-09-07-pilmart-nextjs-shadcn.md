# 필마트 Next.js + shadcn/ui 마이그레이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 필마트를 Next.js 15 + shadcn/ui로 완전 재구현하여 UX/UI를 전면 개선한다.

**Architecture:** `pilmart-next/` 신규 폴더에 Next.js 15 App Router + TypeScript로 구축. Alpine 스토어 → React Context + custom hooks. localStorage 키 구조는 그대로 유지.

**Tech Stack:** Next.js 15, shadcn/ui, Tailwind CSS v4, TypeScript strict, pnpm, Sonner (toast), Toss Payments SDK

**Spec:** `docs/superpowers/specs/2026-09-07-pilmart-nextjs-shadcn-design.md`

## Global Constraints

- 작업 디렉터리: `C:\Users\USER\.antigravity-ide\pilmart-next\`
- pnpm 사용 (npm/yarn 금지)
- TypeScript strict 모드
- localStorage 키 10개 변경 금지: `pilmart_cart`, `pilmart_wishlist`, `pilmart_session`, `pilmart_orders`, `pilmart_pending_order`, `pilmart_products`, `pilmart_notices`, `pilmart_flash_sale`, `pilmart_store_info`, `pilmart_admin_pw`
- Toss client key: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq` → `.env.local`의 `NEXT_PUBLIC_TOSS_CLIENT_KEY`
- Primary 색상: `hsl(142 71% 45%)` (초록)
- 모든 클라이언트 컴포넌트 상단에 `'use client'` 선언
- 기존 `pilmart/` 폴더 절대 수정하지 않음

---

### Task 1: 프로젝트 스캐폴드 + shadcn 초기화

**Files:**
- Create: `pilmart-next/` (Next.js 프로젝트 루트)
- Create: `pilmart-next/.env.local`
- Create: `pilmart-next/public/logo.png` (기존 로고 복사)

- [ ] **Step 1: Next.js 프로젝트 생성**

`C:\Users\USER\.antigravity-ide` 에서 실행:
```powershell
pnpm create next-app@latest pilmart-next --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --no-git
```
(모든 프롬프트에 기본값 사용)

- [ ] **Step 2: shadcn/ui 초기화**

```powershell
cd pilmart-next
pnpm dlx shadcn@latest init
```

프롬프트 응답:
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**

- [ ] **Step 3: shadcn 컴포넌트 일괄 설치**

```powershell
pnpm dlx shadcn@latest add button card badge sheet dialog input label select tabs toggle-group radio-group separator skeleton avatar accordion command table navigation-menu
pnpm add sonner
pnpm add next-themes
```

- [ ] **Step 4: `.env.local` 생성**

```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
```

- [ ] **Step 5: 로고 복사**

```powershell
Copy-Item "..\pilmart\logo.png" "public\logo.png"
```

- [ ] **Step 6: 초록 테마 CSS 변수 설정**

`app/globals.css` 의 `:root` 블록에서 `--primary` 관련 변수를 교체:

```css
:root {
  --primary: 142 71% 45%;
  --primary-foreground: 0 0% 100%;
  --ring: 142 71% 45%;
}
.dark {
  --primary: 142 71% 55%;
  --primary-foreground: 0 0% 100%;
}
```

- [ ] **Step 7: 개발 서버 기동 확인**

```powershell
pnpm dev
```

`http://localhost:3000` 에서 기본 Next.js 페이지 확인. 오류 없으면 서버 종료.

---

### Task 2: 타입 정의 + 데이터 레이어

**Files:**
- Create: `pilmart-next/types/index.ts`
- Create: `pilmart-next/lib/storage.ts`
- Create: `pilmart-next/lib/products.ts`
- Create: `pilmart-next/lib/utils.ts`

- [ ] **Step 1: `types/index.ts` 작성**

```typescript
export interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  originalPrice: number;
  section: 'sale' | 'veg' | 'meat' | 'proc';
  origin: string;
  category: '야채/채소' | '과일' | '축산/계란' | '수산/건어물' | '라면/면류' | '유제품/냉장/냉동' | '캔/통조림';
  storage: string;
  unit: string;
  desc: string;
  imageUrl?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Order {
  orderId: string;
  items: CartItem[];
  total: number;
  method: string;
  createdAt: number;
  paymentKey?: string;
}

export interface Session {
  name: string;
  phone: string;
  loginAt: number;
  provider?: 'local' | 'naver' | 'kakao' | 'google';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  important?: boolean;
}

export interface FlashProduct {
  idx: number;
  name: string;
  price: number;
  originalPrice: number;
  imageUrl?: string;
  desc?: string;
  maxPerCustomer: number;
}

export interface FlashSaleConfig {
  startHour: number;
  endHour: number;
  products: FlashProduct[];
}

export interface StoreInfo {
  name: string;
  phone: string;
  address: string;
  hours?: string;
}

export interface ProductOverride {
  name?: string;
  price?: number;
  imageUrl?: string;
}
```

- [ ] **Step 2: `lib/storage.ts` 작성**

```typescript
export const KEYS = {
  cart: 'pilmart_cart',
  wishlist: 'pilmart_wishlist',
  session: 'pilmart_session',
  orders: 'pilmart_orders',
  pendingOrder: 'pilmart_pending_order',
  products: 'pilmart_products',
  notices: 'pilmart_notices',
  flashSale: 'pilmart_flash_sale',
  storeInfo: 'pilmart_store_info',
  adminPw: 'pilmart_admin_pw',
} as const;

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function lsRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}
```

- [ ] **Step 3: `lib/products.ts` 작성**

기존 `pilmart/js/products.js` 의 PRODUCTS 배열과 PRODUCT_IMAGES 객체를 TypeScript로 변환:

```typescript
import { Product, ProductOverride } from '@/types';
import { KEYS, lsGet } from '@/lib/storage';

export const PRODUCTS: Product[] = [
  { id:'sale1', name:'국내산 삼겹살 500g',  emoji:'🥩', price:9900,  originalPrice:13900, section:'sale', origin:'국내산 (경북)',   category:'축산/계란',         storage:'냉장보관', unit:'500g',  desc:'국내산 한돈 직송. 두툼하고 쫄깃한 삼겹살.' },
  { id:'sale2', name:'양파 3kg',            emoji:'🧅', price:3900,  originalPrice:5900,  section:'sale', origin:'국산',           category:'야채/채소',          storage:'상온보관', unit:'3kg',   desc:'청정 지역 농가 직송. 아삭하고 달콤한 양파.' },
  { id:'sale3', name:'계란 30구 특란',       emoji:'🥚', price:8900,  originalPrice:10900, section:'sale', origin:'국내산',          category:'축산/계란',         storage:'냉장보관', unit:'30구',  desc:'국내산 신선 특란 30구. 단백질 가득.' },
  { id:'sale4', name:'닭가슴살 1kg',         emoji:'🍗', price:7900,  originalPrice:10500, section:'sale', origin:'국내산',          category:'축산/계란',         storage:'냉장보관', unit:'1kg',   desc:'국내산 냉장 닭가슴살. 고단백 저지방.' },
  { id:'sale5', name:'고등어 2마리',         emoji:'🐟', price:5900,  originalPrice:7900,  section:'sale', origin:'국산',           category:'수산/건어물',       storage:'냉장보관', unit:'2마리', desc:'국산 당일 손질 고등어. 오메가-3 풍부.' },
  { id:'sale6', name:'국산 두부 2개입',       emoji:'🟨', price:2900,  originalPrice:3900,  section:'sale', origin:'국산콩',          category:'야채/채소',          storage:'냉장보관', unit:'2모',   desc:'국산콩 100% 부드러운 두부.' },
  { id:'veg1',  name:'양배추 1통',           emoji:'🥬', price:3500,  originalPrice:4500,  section:'veg',  origin:'국산',           category:'야채/채소',          storage:'냉장보관', unit:'1통',   desc:'아삭한 국산 양배추. 겉절이·볶음에 딱.' },
  { id:'veg2',  name:'대파 1단',             emoji:'🌿', price:1900,  originalPrice:2500,  section:'veg',  origin:'국산',           category:'야채/채소',          storage:'냉장보관', unit:'1단',   desc:'향긋한 국산 대파 한 단. 국물 요리 필수.' },
  { id:'veg3',  name:'햇감자 2.5kg',         emoji:'🥔', price:5900,  originalPrice:7900,  section:'veg',  origin:'국산',           category:'야채/채소',          storage:'상온보관', unit:'2.5kg', desc:'국산 햇감자. 포슬포슬 볶음·찜용.' },
  { id:'veg4',  name:'당근 1kg',             emoji:'🥕', price:2900,  originalPrice:3900,  section:'veg',  origin:'국산',           category:'야채/채소',          storage:'냉장보관', unit:'1kg',   desc:'달콤한 국산 당근. 샐러드·볶음밥 활용.' },
  { id:'veg5',  name:'수박 (소) 1통',         emoji:'🍉', price:12900, originalPrice:16900, section:'veg',  origin:'국내산',          category:'과일',              storage:'냉장보관', unit:'1통',   desc:'국내산 시원한 수박. 여름 제철 과일.' },
  { id:'veg6',  name:'복숭아 1.5kg',         emoji:'🍑', price:8900,  originalPrice:11900, section:'veg',  origin:'국내산',          category:'과일',              storage:'상온보관', unit:'1.5kg', desc:'국내산 달콤한 복숭아. 직송 신선함.' },
  { id:'veg7',  name:'포도 2kg',             emoji:'🍇', price:9900,  originalPrice:13900, section:'veg',  origin:'국내산',          category:'과일',              storage:'냉장보관', unit:'2kg',   desc:'국내산 달달한 포도. 직송 신선함.' },
  { id:'veg8',  name:'방울토마토 1kg',        emoji:'🍅', price:4900,  originalPrice:6900,  section:'veg',  origin:'국내산',          category:'야채/채소',          storage:'냉장보관', unit:'1kg',   desc:'국내산 당도 높은 방울토마토. 간식·샐러드용.' },
  { id:'meat1', name:'한우 불고기 300g',      emoji:'🥩', price:16900, originalPrice:21900, section:'meat', origin:'국내산 (1등급↑)', category:'축산/계란',         storage:'냉장보관', unit:'300g',  desc:'1등급 이상 한우 불고기. 달큰한 양념 직송.' },
  { id:'meat2', name:'돼지 목살 500g',        emoji:'🐷', price:7900,  originalPrice:9900,  section:'meat', origin:'국내산',          category:'축산/계란',         storage:'냉장보관', unit:'500g',  desc:'국내산 냉장 목살. 삼겹살보다 쫄깃하고 담백.' },
  { id:'meat3', name:'닭볶음탕용 1kg',        emoji:'🍗', price:6900,  originalPrice:8900,  section:'meat', origin:'국내산',          category:'축산/계란',         storage:'냉장보관', unit:'1kg',   desc:'국내산 닭볶음탕용. 매운 볶음탕 OK.' },
  { id:'fish1', name:'오징어 2마리',          emoji:'🦑', price:7900,  originalPrice:9900,  section:'meat', origin:'국산',           category:'수산/건어물',       storage:'냉장보관', unit:'2마리', desc:'국산 오징어 2마리. 볶음·찌개·덮밥 활용.' },
  { id:'fish2', name:'생새우 500g',           emoji:'🦐', price:12900, originalPrice:15900, section:'meat', origin:'국산',           category:'수산/건어물',       storage:'냉장보관', unit:'500g',  desc:'국산 생새우. 구이·볶음·전 최적.' },
  { id:'fish3', name:'손질 고등어 4토막',      emoji:'🐠', price:6900,  originalPrice:8900,  section:'meat', origin:'국산',           category:'수산/건어물',       storage:'냉장보관', unit:'4토막', desc:'국산 고등어 손질 완료 4토막. 바로 구이·조림.' },
  { id:'proc1', name:'신라면 멀티 5개입',      emoji:'🍜', price:4200,  originalPrice:5000,  section:'proc', origin:'국내산',          category:'라면/면류',         storage:'상온보관', unit:'5개입', desc:'국민 라면 신라면 5개 묶음. 얼큰한 맛.' },
  { id:'proc2', name:'부침두부 2개입',         emoji:'⬜', price:2500,  originalPrice:3200,  section:'proc', origin:'국산콩',          category:'유제품/냉장/냉동',  storage:'냉장보관', unit:'2개입', desc:'국산콩 부침두부 2모. 두부전·된장찌개 활용.' },
  { id:'proc3', name:'사각어묵 400g',          emoji:'🟡', price:3900,  originalPrice:4900,  section:'proc', origin:'국산',           category:'유제품/냉장/냉동',  storage:'냉장보관', unit:'400g',  desc:'사조 사각어묵 400g. 떡볶이·어묵탕에 딱.' },
  { id:'proc4', name:'스팸 클래식 340g',       emoji:'🥫', price:4900,  originalPrice:5900,  section:'proc', origin:'국내산',          category:'캔/통조림',         storage:'상온보관', unit:'340g',  desc:'CJ 스팸 클래식. 밥반찬·도시락 최강 조합.' },
  { id:'proc5', name:'슬라이스 치즈 20장',     emoji:'🧀', price:5900,  originalPrice:7500,  section:'proc', origin:'국내산',          category:'유제품/냉장/냉동',  storage:'냉장보관', unit:'20장',  desc:'서울우유 슬라이스 치즈 20장. 샌드위치·버거용.' },
  { id:'proc6', name:'떠먹는 요거트 3개입',    emoji:'🥛', price:3900,  originalPrice:4900,  section:'proc', origin:'국내산',          category:'유제품/냉장/냉동',  storage:'냉장보관', unit:'3개입', desc:'빙그레 떠먹는 요거트 3개 묶음. 아침 간편식.' },
];

export const PRODUCT_IMAGES: Record<string, string> = {
  'sale1':'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&h=400&q=80',
  'sale2':'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&h=400&q=80',
  'sale3':'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=400&h=400&q=80',
  'sale4':'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&h=400&q=80',
  'sale5':'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&h=400&q=80',
  'sale6':'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=400&q=80',
  'veg1' :'https://images.unsplash.com/photo-1568158879083-c42860933ed7?auto=format&fit=crop&w=400&h=400&q=80',
  'veg2' :'https://images.unsplash.com/photo-1604866830893-c13cafa515d5?auto=format&fit=crop&w=400&h=400&q=80',
  'veg3' :'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=400&h=400&q=80',
  'veg4' :'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=400&h=400&q=80',
  'veg5' :'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=400&h=400&q=80',
  'veg6' :'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&h=400&q=80',
  'veg7' :'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=400&h=400&q=80',
  'veg8' :'https://images.unsplash.com/photo-1524593166156-312f362cada0?auto=format&fit=crop&w=400&h=400&q=80',
  'meat1':'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=400&h=400&q=80',
  'meat2':'https://images.unsplash.com/photo-1574691250077-03a929faece5?auto=format&fit=crop&w=400&h=400&q=80',
  'meat3':'https://images.unsplash.com/photo-1481671703460-040cb8a2d909?auto=format&fit=crop&w=400&h=400&q=80',
  'fish1':'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=400&h=400&q=80',
  'fish2':'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&h=400&q=80',
  'fish3':'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?auto=format&fit=crop&w=400&h=400&q=80',
  'proc1':'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=400&q=80',
  'proc2':'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=400&q=80',
  'proc3':'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=400&h=400&q=80',
  'proc4':'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=400&q=80',
  'proc5':'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=400&h=400&q=80',
  'proc6':'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&h=400&q=80',
};

export function getProductImage(id: string): string {
  const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
  return overrides[id]?.imageUrl ?? PRODUCT_IMAGES[id] ?? '';
}

export function getProducts(): Product[] {
  const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
  return PRODUCTS.map(p => ({ ...p, ...overrides[p.id] }));
}
```

- [ ] **Step 4: `lib/utils.ts` 에 `formatPrice` 추가**

shadcn의 `cn()` 유틸이 이미 있으므로 `formatPrice` 만 추가:

```typescript
// lib/utils.ts 기존 내용 아래에 추가
export function formatPrice(n: number): string {
  return Number(n).toLocaleString('ko-KR') + '원';
}
```

- [ ] **Step 5: TypeScript 타입 체크**

```powershell
pnpm tsc --noEmit
```

오류 없음 확인.

---

### Task 3: 상태 관리 (Context + Hooks)

**Files:**
- Create: `pilmart-next/context/StoreProvider.tsx`
- Create: `pilmart-next/hooks/useCart.ts`
- Create: `pilmart-next/hooks/useWishlist.ts`
- Create: `pilmart-next/hooks/useAuth.ts`
- Create: `pilmart-next/hooks/useTossPayment.ts`

**Interfaces Produced:**
- `useCart()` → `{ items, isOpen, count, total, addItem, updateQty, removeItem, clearCart, openCart, closeCart, goCheckout }`
- `useWishlist()` → `{ ids, has, toggle, count }`
- `useAuth()` → `{ user, isLoggedIn, logout }`
- `useTossPayment()` → `{ requestPayment }`

- [ ] **Step 1: `context/StoreProvider.tsx` 작성**

```typescript
'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { CartItem, Product, Session } from '@/types';
import { KEYS, lsGet, lsSet, lsRemove } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ── Cart ──────────────────────────────────────────────────────────────
interface CartCtx {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  total: number;
  addItem: (product: Product) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  goCheckout: () => void;
}
const CartContext = createContext<CartCtx | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setItems(lsGet<CartItem[]>(KEYS.cart, []));
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    lsSet(KEYS.cart, next);
  }, []);

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      const next = existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
      lsSet(KEYS.cart, next);
      return next;
    });
    setIsOpen(true);
    toast.success(`${product.name} 담았습니다`);
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setItems(prev => {
      const next = prev
        .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0);
      lsSet(KEYS.cart, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      lsSet(KEYS.cart, next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    lsRemove(KEYS.cart);
  }, []);

  const goCheckout = useCallback(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    if (count === 0) { toast.error('장바구니가 비어 있습니다.'); return; }
    if (total < 100000) {
      toast.error(`최소 주문금액은 100,000원입니다. ${(100000 - total).toLocaleString('ko-KR')}원 더 담아주세요.`);
      return;
    }
    const session = lsGet<Session | null>(KEYS.session, null);
    if (!session) { router.push('/auth?redirect=/checkout'); return; }
    setIsOpen(false);
    router.push('/checkout');
  }, [items, router]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, isOpen, count, total,
      addItem, updateQty, removeItem, clearCart,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      goCheckout,
    }}>
      {children}
    </CartContext.Provider>
  );
}

// ── Wishlist ──────────────────────────────────────────────────────────
interface WishlistCtx {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}
const WishlistContext = createContext<WishlistCtx | null>(null);

function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(lsGet<string[]>(KEYS.wishlist, []));
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      lsSet(KEYS.wishlist, next);
      return next;
    });
  }, []);

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, has: (id) => ids.includes(id), toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

// ── Auth ──────────────────────────────────────────────────────────────
interface AuthCtx {
  user: Session | null;
  isLoggedIn: boolean;
  login: (session: Session) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthCtx | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = lsGet<Session | null>(KEYS.session, null);
    if (!raw) return;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (raw.loginAt && Date.now() - raw.loginAt > thirtyDays) {
      lsRemove(KEYS.session);
    } else {
      setUser(raw);
    }
  }, []);

  const login = useCallback((session: Session) => {
    lsSet(KEYS.session, session);
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    lsRemove(KEYS.session);
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Root Provider ─────────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────
export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within StoreProvider');
  return ctx;
}

export function useWishlist(): WishlistCtx {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within StoreProvider');
  return ctx;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within StoreProvider');
  return ctx;
}
```

- [ ] **Step 2: `hooks/useTossPayment.ts` 작성**

```typescript
'use client';

declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
    };
  }
}

export function useTossPayment() {
  const requestPayment = async (method: string, orderInfo: Record<string, unknown>) => {
    const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
    const origin = window.location.origin;
    await toss.requestPayment(method, {
      ...orderInfo,
      successUrl: `${origin}/success`,
      failUrl: `${origin}/fail`,
    });
  };
  return { requestPayment };
}
```

- [ ] **Step 3: 개별 hook 파일 (re-export 패턴)**

`hooks/useCart.ts`:
```typescript
export { useCart } from '@/context/StoreProvider';
```

`hooks/useWishlist.ts`:
```typescript
export { useWishlist } from '@/context/StoreProvider';
```

`hooks/useAuth.ts`:
```typescript
export { useAuth } from '@/context/StoreProvider';
```

- [ ] **Step 4: 타입 체크**

```powershell
pnpm tsc --noEmit
```

오류 없음 확인.

---

### Task 4: 루트 레이아웃 + Navbar + Footer + CartSheet

**Files:**
- Modify: `pilmart-next/app/layout.tsx`
- Create: `pilmart-next/components/layout/Navbar.tsx`
- Create: `pilmart-next/components/layout/Footer.tsx`
- Create: `pilmart-next/components/layout/CartSheet.tsx`

- [ ] **Step 1: `app/layout.tsx` 작성**

```typescript
import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreProvider';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartSheet } from '@/components/layout/CartSheet';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '필마트 — 신선식품 당일배송',
  description: '신선한 야채, 과일, 육류, 수산물을 당일배송으로 만나보세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={geist.className}>
        <Script src="https://js.tosspayments.com/v1/payment" strategy="beforeInteractive" />
        <StoreProvider>
          <Navbar />
          <CartSheet />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster richColors position="top-center" />
        </StoreProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: `components/layout/Navbar.tsx` 작성**

```typescript
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, User, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { count, openCart } = useCart();
  const { count: wishCount } = useWishlist();
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="필마트" width={32} height={32} className="rounded" />
          <span className="text-xl font-bold text-primary">필마트</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-primary transition-colors">홈</Link>
          <Link href="/notice" className="hover:text-primary transition-colors">공지사항</Link>
          <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">고객문의</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {count}
              </Badge>
            )}
          </Button>

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              {wishCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {wishCount}
                </Badge>
              )}
            </Button>
          </Link>

          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user?.name}님</span>
              <Button variant="outline" size="sm" onClick={logout}>로그아웃</Button>
              <Link href="/orders"><Button variant="ghost" size="sm">주문내역</Button></Link>
            </div>
          ) : (
            <Link href="/auth" className="hidden md:block">
              <Button variant="outline" size="sm">로그인</Button>
            </Link>
          )}

          {/* 모바일 햄버거 */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-medium">홈</Link>
                <Link href="/notice" className="text-lg font-medium">공지사항</Link>
                <Link href="/faq" className="text-lg font-medium">FAQ</Link>
                <Link href="/contact" className="text-lg font-medium">고객문의</Link>
                {isLoggedIn ? (
                  <>
                    <Link href="/orders" className="text-lg font-medium">주문내역</Link>
                    <button onClick={logout} className="text-left text-lg font-medium text-destructive">로그아웃</button>
                  </>
                ) : (
                  <Link href="/auth" className="text-lg font-medium">로그인</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: `components/layout/CartSheet.tsx` 작성**

```typescript
'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { getProductImage } from '@/lib/products';

export function CartSheet() {
  const { items, isOpen, closeCart, updateQty, removeItem, total, goCheckout } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={v => !v && closeCart()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>장바구니 ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ShoppingBag className="h-16 w-16" />
            <p>장바구니가 비어 있습니다</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={getProductImage(item.id) || `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='80'>${item.emoji}</text></svg>`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-sm text-primary font-semibold">{formatPrice(item.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-4 text-center">{item.qty}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>최소주문금액</span>
                <span>100,000원</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>합계</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={goCheckout}>
                결제하기
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: `components/layout/Footer.tsx` 작성**

```typescript
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-3">필마트</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              신선식품 당일배송<br />고객 만족 최우선
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">고객지원</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/notice" className="hover:text-foreground">공지사항</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">자주 묻는 질문</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">고객문의</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">약관</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">주문</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/orders" className="hover:text-foreground">주문내역</Link></li>
              <li><Link href="/wishlist" className="hover:text-foreground">찜 목록</Link></li>
            </ul>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground text-center">© 2026 필마트. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: `pnpm dev` 기동 후 레이아웃 확인**

`http://localhost:3000` 에서 Navbar, Footer 렌더링 확인. CartSheet 아이콘 클릭 시 드로어 열림 확인.

---

### Task 5: 상품 컴포넌트 + 메인 페이지

**Files:**
- Create: `pilmart-next/components/product/ProductCard.tsx`
- Create: `pilmart-next/components/product/ProductGrid.tsx`
- Create: `pilmart-next/components/product/CategoryFilter.tsx`
- Create: `pilmart-next/components/home/HeroBanner.tsx`
- Create: `pilmart-next/components/home/FlashSaleSection.tsx`
- Modify: `pilmart-next/app/page.tsx`

- [ ] **Step 1: `components/product/ProductCard.tsx` 작성**

```typescript
'use client';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/products';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const img = getProductImage(product.id);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">{product.emoji}</div>
          )}
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-destructive">{discount}%</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            onClick={e => { e.preventDefault(); toggle(product.id); }}
          >
            <Heart className={`h-4 w-4 ${has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </Link>
      <CardContent className="p-3 space-y-2">
        <Link href={`/product/${product.id}`}>
          <p className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">{product.name}</p>
        </Link>
        <p className="text-xs text-muted-foreground">{product.unit} · {product.origin}</p>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
        <Button
          className="w-full"
          size="sm"
          onClick={() => addItem(product)}
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          담기
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: `components/product/CategoryFilter.tsx` 작성**

```typescript
'use client';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const CATEGORIES = ['전체', '야채/채소', '과일', '축산/계란', '수산/건어물', '라면/면류', '유제품/냉장/냉동', '캔/통조림'];

interface CategoryFilterProps {
  value: string;
  onChange: (val: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <ToggleGroup type="single" value={value} onValueChange={v => onChange(v || '전체')} className="flex-nowrap">
        {CATEGORIES.map(cat => (
          <ToggleGroupItem key={cat} value={cat} className="whitespace-nowrap text-xs px-3">
            {cat}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
```

- [ ] **Step 3: `components/product/ProductGrid.tsx` 작성**

```typescript
'use client';
import { useState, useMemo } from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { CategoryFilter } from './CategoryFilter';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export function ProductGrid({ products, title }: ProductGridProps) {
  const [category, setCategory] = useState('전체');

  const filtered = useMemo(() =>
    category === '전체' ? products : products.filter(p => p.category === category),
  [products, category]);

  return (
    <section className="space-y-4">
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      <CategoryFilter value={category} onChange={setCategory} />
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">해당 카테고리 상품이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: `components/home/HeroBanner.tsx` 작성**

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-lg space-y-4">
          <Badge variant="secondary" className="text-primary border-primary/30">🚚 당일배송</Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            신선한 식재료를<br />
            <span className="text-primary">당일배송</span>으로
          </h1>
          <p className="text-muted-foreground text-lg">
            농가 직송 야채·과일부터 신선 육류·수산물까지.<br />
            오전 주문 시 당일 오후 배송.
          </p>
          <div className="flex gap-3">
            <Link href="#products">
              <Button size="lg">지금 쇼핑하기</Button>
            </Link>
            <Link href="/notice">
              <Button variant="outline" size="lg">공지사항</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: `components/home/FlashSaleSection.tsx` 작성**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { FlashSaleConfig } from '@/types';
import { KEYS, lsGet } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export function FlashSaleSection() {
  const [config, setConfig] = useState<FlashSaleConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [active, setActive] = useState(false);

  useEffect(() => {
    const cfg = lsGet<FlashSaleConfig | null>(KEYS.flashSale, null);
    setConfig(cfg);
    if (!cfg) return;

    const tick = () => {
      const now = new Date();
      const h = now.getHours();
      const isActive = h >= cfg.startHour && h < cfg.endHour;
      setActive(isActive);
      if (isActive) {
        const end = new Date();
        end.setHours(cfg.endHour, 0, 0, 0);
        const diff = end.getTime() - Date.now();
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}분 ${s}초`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!config || !active || config.products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-xl font-bold">플래시 세일</h2>
        </div>
        <Badge variant="destructive" className="animate-pulse">{timeLeft} 남음</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {config.products.map((fp, idx) => (
          <Card key={idx} className="overflow-hidden border-yellow-300">
            <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
              {fp.imageUrl ? <img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" /> : '⚡'}
            </div>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium line-clamp-2">{fp.name}</p>
              <div className="flex gap-2 items-center">
                <span className="font-bold text-destructive">{formatPrice(fp.price)}</span>
                <span className="text-xs line-through text-muted-foreground">{formatPrice(fp.originalPrice)}</span>
              </div>
              <Link href={`/flash-product/${idx}`}>
                <Button size="sm" variant="destructive" className="w-full">구매하기</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: `app/page.tsx` 작성**

```typescript
'use client';
import { HeroBanner } from '@/components/home/HeroBanner';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getProducts } from '@/lib/products';

export default function HomePage() {
  const products = getProducts();
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <HeroBanner />
      <FlashSaleSection />
      <div id="products">
        <ProductGrid products={products} title="전체 상품" />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: 메인 페이지 시각 확인**

`pnpm dev` → `http://localhost:3000`
- 히어로 배너 렌더링 확인
- 상품 그리드 26개 카드 확인
- 카테고리 필터 동작 확인
- 장바구니 담기 → CartSheet 열림 확인
- 찜 토글 확인

---

### Task 6: 상품 상세 페이지 + 플래시 세일 상품 페이지

**Files:**
- Create: `pilmart-next/app/product/[id]/page.tsx`
- Create: `pilmart-next/app/flash-product/[idx]/page.tsx`

- [ ] **Step 1: `app/product/[id]/page.tsx` 작성**

```typescript
'use client';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { getProducts, getProductImage } from '@/lib/products';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingCart, Truck, Thermometer, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const products = getProducts();
  const product = products.find(p => p.id === id);
  if (!product) notFound();

  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const img = getProductImage(product.id);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">{product.emoji}</div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Badge variant="outline" className="mb-2">{product.category}</Badge>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-1">{product.unit}</p>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                <Badge className="bg-destructive">{discount}% 할인</Badge>
              </>
            )}
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /><span>원산지: {product.origin}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Thermometer className="h-4 w-4" /><span>보관: {product.storage}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" /><span>오전 주문 시 당일 배송</span>
            </div>
          </div>

          <p className="text-muted-foreground">{product.desc}</p>

          <div className="flex gap-3">
            <Button className="flex-1" size="lg" onClick={() => addItem(product)}>
              <ShoppingCart className="h-5 w-5 mr-2" />
              장바구니 담기
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => toggle(product.id)}
              className={has(product.id) ? 'text-red-500 border-red-200' : ''}
            >
              <Heart className={`h-5 w-5 ${has(product.id) ? 'fill-red-500' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `app/flash-product/[idx]/page.tsx` 작성**

```typescript
'use client';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { KEYS, lsGet } from '@/lib/storage';
import { FlashSaleConfig } from '@/types';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function FlashProductPage({ params }: { params: Promise<{ idx: string }> }) {
  const { idx } = use(params);
  const idxNum = parseInt(idx, 10);
  const config = lsGet<FlashSaleConfig | null>(KEYS.flashSale, null);
  const fp = config?.products[idxNum];
  if (!fp) notFound();

  const { items, addItem } = useCart();
  const cartQty = items.find(i => i.id === `flash${idxNum}`)?.qty ?? 0;

  const handleAdd = () => {
    if (cartQty >= fp.maxPerCustomer) {
      toast.error(`1인 최대 ${fp.maxPerCustomer}개까지 구매 가능합니다.`);
      return;
    }
    addItem({
      id: `flash${idxNum}`,
      name: fp.name,
      emoji: '⚡',
      price: fp.price,
      originalPrice: fp.originalPrice,
      section: 'sale',
      origin: '국내산',
      category: '야채/채소',
      storage: '냉장보관',
      unit: '1개',
      desc: fp.desc ?? '',
      imageUrl: fp.imageUrl,
    });
  };

  const discount = Math.round((1 - fp.price / fp.originalPrice) * 100);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <h1 className="text-2xl font-bold">플래시 세일</h1>
          <Badge variant="destructive">한정수량</Badge>
        </div>

        <div className="aspect-square rounded-2xl overflow-hidden bg-muted max-w-sm mx-auto">
          {fp.imageUrl
            ? <img src={fp.imageUrl} alt={fp.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-8xl">⚡</div>
          }
        </div>

        <div>
          <h2 className="text-xl font-bold">{fp.name}</h2>
          {fp.desc && <p className="text-muted-foreground mt-2">{fp.desc}</p>}
        </div>

        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-destructive">{formatPrice(fp.price)}</span>
          <span className="text-lg text-muted-foreground line-through">{formatPrice(fp.originalPrice)}</span>
          <Badge className="bg-destructive">{discount}%</Badge>
        </div>

        <p className="text-sm text-muted-foreground">1인 최대 {fp.maxPerCustomer}개 / 현재 {cartQty}개 담음</p>

        <Button className="w-full" size="lg" onClick={handleAdd} variant="destructive">
          <ShoppingCart className="h-5 w-5 mr-2" />
          장바구니 담기
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 상품 상세 시각 확인**

`http://localhost:3000/product/sale1` → 삼겹살 상세 페이지 확인

---

### Task 7: 로그인/회원가입 페이지

**Files:**
- Create: `pilmart-next/app/auth/page.tsx`

- [ ] **Step 1: `app/auth/page.tsx` 작성**

```typescript
'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

function AuthForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/';

  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', password: '', confirm: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.phone || !loginForm.password) { toast.error('전화번호와 비밀번호를 입력해주세요.'); return; }
    login({ name: loginForm.phone, phone: loginForm.phone, loginAt: Date.now(), provider: 'local' });
    toast.success('로그인되었습니다.');
    router.push(redirect);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.phone || !signupForm.password) { toast.error('모든 항목을 입력해주세요.'); return; }
    if (signupForm.password !== signupForm.confirm) { toast.error('비밀번호가 일치하지 않습니다.'); return; }
    login({ name: signupForm.name, phone: signupForm.phone, loginAt: Date.now(), provider: 'local' });
    toast.success('회원가입이 완료되었습니다.');
    router.push(redirect);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">필마트</CardTitle>
          <p className="text-muted-foreground text-sm">신선식품 당일배송 쇼핑몰</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone">전화번호</Label>
                  <Input id="login-phone" placeholder="010-0000-0000" value={loginForm.phone} onChange={e => setLoginForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-pw">비밀번호</Label>
                  <Input id="login-pw" type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full">로그인</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">이름</Label>
                  <Input id="signup-name" placeholder="홍길동" value={signupForm.name} onChange={e => setSignupForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">전화번호</Label>
                  <Input id="signup-phone" placeholder="010-0000-0000" value={signupForm.phone} onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-pw">비밀번호</Label>
                  <Input id="signup-pw" type="password" value={signupForm.password} onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">비밀번호 확인</Label>
                  <Input id="signup-confirm" type="password" value={signupForm.confirm} onChange={e => setSignupForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full">회원가입</Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />
          <p className="text-xs text-center text-muted-foreground">소셜 로그인은 준비 중입니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>;
}
```

---

### Task 8: 결제 페이지

**Files:**
- Create: `pilmart-next/app/checkout/page.tsx`

- [ ] **Step 1: `app/checkout/page.tsx` 작성**

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useTossPayment } from '@/hooks/useTossPayment';
import { KEYS, lsSet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { CreditCard, Banknote, Handshake } from 'lucide-react';

const METHODS = [
  { value: '카드', label: '온라인 카드', icon: CreditCard, toss: true },
  { value: '계좌이체', label: '온라인 계좌이체', icon: Banknote, toss: true },
  { value: 'meet-card', label: '만나서 카드결제', icon: CreditCard, toss: false },
  { value: 'meet-cash', label: '만나서 현금결제', icon: Handshake, toss: false },
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { requestPayment } = useTossPayment();
  const router = useRouter();

  const [method, setMethod] = useState('카드');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    router.push('/');
    return null;
  }

  const orderId = `pilmart_${Date.now()}`;

  const handlePay = async () => {
    if (!address.trim()) { toast.error('배송지를 입력해주세요.'); return; }
    setLoading(true);

    const pendingOrder = {
      orderId,
      items,
      total,
      method,
      createdAt: Date.now(),
      address,
      memo,
    };
    lsSet(KEYS.pendingOrder, pendingOrder);

    const selectedMethod = METHODS.find(m => m.value === method)!;

    if (!selectedMethod.toss) {
      router.push(`/success?method=${method}&orderId=${orderId}&amount=${total}`);
      return;
    }

    try {
      await requestPayment(method, {
        amount: total,
        orderId,
        orderName: `필마트 주문 (${items.length}개 상품)`,
        customerName: user?.name ?? '고객',
      });
    } catch (err) {
      toast.error('결제가 취소되었습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">결제</h1>

      <Card>
        <CardHeader><CardTitle>주문 상품 ({items.length}개)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} × {item.qty}</span>
              <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>합계</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>배송 정보</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">배송지 주소</Label>
            <Input id="address" placeholder="주소를 입력해주세요" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">배송 메모 (선택)</Label>
            <Input id="memo" placeholder="문 앞에 놓아주세요" value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>결제 수단</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={method} onValueChange={setMethod} className="space-y-3">
            {METHODS.map(m => (
              <Label key={m.value} htmlFor={m.value}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value={m.value} id={m.value} />
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <span>{m.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handlePay} disabled={loading}>
        {loading ? '처리 중...' : `${formatPrice(total)} 결제하기`}
      </Button>
    </div>
  );
}
```

---

### Task 9: 결제 완료 / 실패 페이지

**Files:**
- Create: `pilmart-next/app/success/page.tsx`
- Create: `pilmart-next/app/fail/page.tsx`

- [ ] **Step 1: `app/success/page.tsx` 작성**

```typescript
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { KEYS, lsGet, lsSet, lsRemove } from '@/lib/storage';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

function SuccessContent() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    setDone(true);

    const pending = lsGet<(Order & { address?: string }) | null>(KEYS.pendingOrder, null);
    if (!pending) return;

    const order: Order = {
      orderId: params.get('orderId') ?? pending.orderId,
      items: pending.items,
      total: Number(params.get('amount') ?? pending.total),
      method: params.get('method') ?? pending.method,
      createdAt: Date.now(),
      paymentKey: params.get('paymentKey') ?? undefined,
    };

    const orders = lsGet<Order[]>(KEYS.orders, []);
    lsSet(KEYS.orders, [order, ...orders].slice(0, 30));
    lsRemove(KEYS.pendingOrder);
    clearCart();
  }, []);

  const amount = params.get('amount');

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
      <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
      <h1 className="text-2xl font-bold">결제 완료</h1>
      {amount && <p className="text-muted-foreground">결제 금액: <span className="font-semibold text-foreground">{formatPrice(Number(amount))}</span></p>}
      <Card><CardContent className="pt-6 text-sm text-muted-foreground">오전 주문 시 당일 오후 배송됩니다.</CardContent></Card>
      <div className="flex gap-3 justify-center">
        <Link href="/orders"><Button variant="outline">주문내역 보기</Button></Link>
        <Link href="/"><Button>계속 쇼핑하기</Button></Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
```

- [ ] **Step 2: `app/fail/page.tsx` 작성**

```typescript
'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

function FailContent() {
  const params = useSearchParams();
  const message = params.get('message') ?? '결제가 취소되었습니다.';

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
      <XCircle className="h-16 w-16 text-destructive mx-auto" />
      <h1 className="text-2xl font-bold">결제 실패</h1>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex gap-3 justify-center">
        <Link href="/checkout"><Button variant="outline">다시 시도</Button></Link>
        <Link href="/"><Button>홈으로</Button></Link>
      </div>
    </div>
  );
}

export default function FailPage() {
  return <Suspense><FailContent /></Suspense>;
}
```

---

### Task 10: 주문내역 + 찜 목록

**Files:**
- Create: `pilmart-next/app/orders/page.tsx`
- Create: `pilmart-next/app/wishlist/page.tsx`

- [ ] **Step 1: `app/orders/page.tsx` 작성**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { Order } from '@/types';
import { KEYS, lsGet } from '@/lib/storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(lsGet<Order[]>(KEYS.orders, []));
  }, []);

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">주문내역</h1>
        <p className="text-muted-foreground">주문 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">주문내역</h1>
      <Accordion type="single" collapsible className="space-y-3">
        {orders.map(order => (
          <AccordionItem key={order.orderId} value={order.orderId} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-4 text-left">
                <div>
                  <p className="font-medium text-sm">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</p>
                  <p className="text-muted-foreground text-xs">{order.orderId}</p>
                </div>
                <Badge variant="outline">{order.method}</Badge>
                <span className="text-primary font-semibold ml-auto mr-4">{formatPrice(order.total)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 pb-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} × {item.qty}</span>
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
```

- [ ] **Step 2: `app/wishlist/page.tsx` 작성**

```typescript
'use client';
import { useWishlist } from '@/hooks/useWishlist';
import { getProducts } from '@/lib/products';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { ids } = useWishlist();
  const all = getProducts();
  const products = all.filter(p => ids.includes(p.id));

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">찜 목록</h1>
        <p className="text-muted-foreground">찜한 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">찜 목록 ({products.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
```

---

### Task 11: 관리자 페이지

**Files:**
- Create: `pilmart-next/app/admin/page.tsx`

- [ ] **Step 1: `app/admin/page.tsx` 작성**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { KEYS, lsGet, lsSet } from '@/lib/storage';
import { Order, Notice, FlashSaleConfig, StoreInfo, ProductOverride } from '@/types';
import { PRODUCTS } from '@/lib/products';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ name: '필마트', phone: '', address: '' });
  const [overrides, setOverrides] = useState<Record<string, ProductOverride>>({});
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });

  useEffect(() => {
    if (!authed) return;
    setOrders(lsGet<Order[]>(KEYS.orders, []));
    setNotices(lsGet<Notice[]>(KEYS.notices, []));
    setStoreInfo(lsGet<StoreInfo>(KEYS.storeInfo, { name: '필마트', phone: '', address: '' }));
    setOverrides(lsGet<Record<string, ProductOverride>>(KEYS.products, {}));
  }, [authed]);

  const handleLogin = () => {
    const saved = lsGet<string>(KEYS.adminPw, '1234');
    if (pw === saved) { setAuthed(true); }
    else { toast.error('비밀번호가 틀렸습니다.'); }
  };

  if (!authed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">관리자</h1>
        <div className="space-y-2">
          <Label>비밀번호</Label>
          <Input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <Button className="w-full" onClick={handleLogin}>로그인</Button>
      </div>
    );
  }

  const saveOverride = (id: string, field: keyof ProductOverride, value: string | number) => {
    const next = { ...overrides, [id]: { ...overrides[id], [field]: value } };
    setOverrides(next);
    lsSet(KEYS.products, next);
    toast.success('저장됨');
  };

  const addNotice = () => {
    if (!newNotice.title) { toast.error('제목을 입력해주세요.'); return; }
    const n: Notice = { id: Date.now().toString(), ...newNotice, createdAt: Date.now() };
    const next = [n, ...notices];
    setNotices(next);
    lsSet(KEYS.notices, next);
    setNewNotice({ title: '', content: '' });
    toast.success('공지가 등록되었습니다.');
  };

  const removeNotice = (id: string) => {
    const next = notices.filter(n => n.id !== id);
    setNotices(next);
    lsSet(KEYS.notices, next);
  };

  const saveStoreInfo = () => {
    lsSet(KEYS.storeInfo, storeInfo);
    toast.success('저장됨');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">관리자</h1>
      <Tabs defaultValue="orders">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="orders">주문</TabsTrigger>
          <TabsTrigger value="products">상품</TabsTrigger>
          <TabsTrigger value="notices">공지</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* 주문 탭 */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader><CardTitle>주문 내역 ({orders.length}건)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>주문번호</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>결제수단</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o.orderId}>
                      <TableCell className="text-xs text-muted-foreground">{o.orderId.slice(-8)}</TableCell>
                      <TableCell className="text-sm">{new Date(o.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell className="font-medium">{formatPrice(o.total)}</TableCell>
                      <TableCell>{o.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상품 탭 */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader><CardTitle>상품 가격/이름 수정</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>기본 가격</TableHead>
                    <TableHead>수정 가격</TableHead>
                    <TableHead>저장</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRODUCTS.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatPrice(p.price)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-28"
                          defaultValue={overrides[p.id]?.price ?? p.price}
                          onBlur={e => saveOverride(p.id, 'price', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => saveOverride(p.id, 'price', overrides[p.id]?.price ?? p.price)}>저장</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 공지 탭 */}
        <TabsContent value="notices" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>공지 등록</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input value={newNotice.title} onChange={e => setNewNotice(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>내용</Label>
                <Input value={newNotice.content} onChange={e => setNewNotice(p => ({ ...p, content: e.target.value }))} />
              </div>
              <Button onClick={addNotice}>등록</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>공지 목록</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>제목</TableHead><TableHead>날짜</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map(n => (
                    <TableRow key={n.id}>
                      <TableCell>{n.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell><Button size="sm" variant="destructive" onClick={() => removeNotice(n.id)}>삭제</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader><CardTitle>매장 정보</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(['name', 'phone', 'address', 'hours'] as const).map(field => (
                <div key={field} className="space-y-2">
                  <Label>{field === 'name' ? '매장명' : field === 'phone' ? '전화번호' : field === 'address' ? '주소' : '영업시간'}</Label>
                  <Input value={(storeInfo as Record<string, string>)[field] ?? ''} onChange={e => setStoreInfo(p => ({ ...p, [field]: e.target.value }))} />
                </div>
              ))}
              <Button onClick={saveStoreInfo}>저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Task 12: 정보 페이지 (공지, FAQ, 문의, 약관, 개인정보, 네이버콜백)

**Files:**
- Create: `pilmart-next/app/notice/page.tsx`
- Create: `pilmart-next/app/faq/page.tsx`
- Create: `pilmart-next/app/contact/page.tsx`
- Create: `pilmart-next/app/terms/page.tsx`
- Create: `pilmart-next/app/privacy/page.tsx`
- Create: `pilmart-next/app/naver-callback/page.tsx`

- [ ] **Step 1: `app/notice/page.tsx` 작성**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { Notice } from '@/types';
import { KEYS, lsGet } from '@/lib/storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  useEffect(() => { setNotices(lsGet<Notice[]>(KEYS.notices, [])); }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">공지사항</h1>
      {notices.length === 0
        ? <p className="text-muted-foreground text-center py-16">등록된 공지가 없습니다.</p>
        : (
          <Accordion type="single" collapsible className="space-y-2">
            {notices.map(n => (
              <AccordionItem key={n.id} value={n.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {n.important && <Badge>중요</Badge>}
                    <span>{n.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto mr-4">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground pb-4">{n.content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      }
    </div>
  );
}
```

- [ ] **Step 2: `app/faq/page.tsx` 작성**

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQS = [
  { q: '배송 지역은 어디인가요?', a: '현재 전국 배송 가능합니다. 도서산간 지역은 추가 배송비가 발생할 수 있습니다.' },
  { q: '최소 주문금액이 있나요?', a: '최소 주문금액은 100,000원입니다.' },
  { q: '당일 배송 조건은 무엇인가요?', a: '오전 11시 이전 주문 시 당일 오후 배송됩니다.' },
  { q: '교환/환불은 어떻게 하나요?', a: '신선식품 특성상 수령 후 24시간 이내 고객문의 페이지를 통해 접수해주세요.' },
  { q: '회원 가입 혜택이 있나요?', a: '회원 가입 시 첫 주문 무료배송 혜택이 제공됩니다.' },
];

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">자주 묻는 질문</h1>
      <Accordion type="single" collapsible className="space-y-2">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline text-left">{f.q}</AccordionTrigger>
            <AccordionContent><p className="text-muted-foreground pb-4">{f.a}</p></AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
```

- [ ] **Step 3: `app/contact/page.tsx` 작성**

```typescript
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', title: '', content: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('제목과 내용을 입력해주세요.'); return; }
    toast.success('문의가 접수되었습니다. 1-2일 내에 답변드리겠습니다.');
    setForm({ name: '', phone: '', title: '', content: '' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader><CardTitle>고객문의</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {([['name', '이름'], ['phone', '전화번호'], ['title', '제목'], ['content', '문의 내용']] as const).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Input id={field} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
            <Button type="submit" className="w-full">문의 접수</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: `app/terms/page.tsx` 작성**

```typescript
export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl prose prose-sm">
      <h1>이용약관</h1>
      <p>필마트 서비스 이용약관입니다.</p>
      <h2>제1조 목적</h2>
      <p>본 약관은 필마트가 제공하는 온라인 쇼핑몰 서비스 이용에 관한 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
      <h2>제2조 서비스 이용</h2>
      <p>서비스는 만 14세 이상 누구나 이용할 수 있습니다. 회원가입 시 정확한 정보를 제공해야 합니다.</p>
      <h2>제3조 개인정보</h2>
      <p>개인정보 처리에 관해서는 개인정보처리방침을 따릅니다.</p>
    </div>
  );
}
```

- [ ] **Step 5: `app/privacy/page.tsx` 작성**

```typescript
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl prose prose-sm">
      <h1>개인정보처리방침</h1>
      <p>필마트는 고객의 개인정보를 소중히 여깁니다.</p>
      <h2>수집하는 개인정보</h2>
      <p>이름, 전화번호, 배송지 주소를 수집합니다. 모든 정보는 브라우저 로컬 스토리지에만 저장되며 서버로 전송되지 않습니다.</p>
      <h2>개인정보 보유기간</h2>
      <p>로그인 세션은 30일 후 자동 만료됩니다. 브라우저 데이터 삭제 시 즉시 파기됩니다.</p>
    </div>
  );
}
```

- [ ] **Step 6: `app/naver-callback/page.tsx` 작성**

```typescript
'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function NaverCallback() {
  const params = useSearchParams();
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const access_token = new URLSearchParams(hash.replace('#', '?')).get('access_token');
    if (access_token) {
      login({ name: '네이버 사용자', phone: '', loginAt: Date.now(), provider: 'naver' });
    }
    router.replace('/');
  }, []);

  return <p className="text-center py-16">로그인 처리 중...</p>;
}

export default function NaverCallbackPage() {
  return <Suspense><NaverCallback /></Suspense>;
}
```

- [ ] **Step 7: 최종 빌드 확인**

```powershell
pnpm build
```

빌드 오류 없음 확인.

- [ ] **Step 8: 전체 페이지 순회 시각 확인**

`pnpm dev` 후 아래 순서로 확인:
1. `/` — 메인, 상품 그리드, 카테고리 필터
2. `/product/sale1` — 상품 상세
3. `/auth` — 로그인 탭/회원가입 탭
4. `/wishlist` — 찜 목록 (비어있음 상태)
5. `/orders` — 주문 내역 (비어있음 상태)
6. `/admin` — 관리자 로그인 (기본 pw: 1234), 4개 탭
7. `/notice`, `/faq`, `/contact` — 정보 페이지
8. 장바구니에 상품 담기 → CartSheet 열림 → 결제하기 클릭 → `/checkout`

---

## 자체 검토

**스펙 커버리지:**
- 모든 18개 HTML 페이지 → React 라우트 구현 ✓
- localStorage 10개 키 동일 유지 ✓
- shadcn 컴포넌트 매핑 (Sheet, Card, Badge, Dialog, Tabs, ToggleGroup, RadioGroup, Accordion, Table) ✓
- 초록 primary 테마 ✓
- Toss Payments 환경변수 이동 ✓
- CartSheet 드로어 패턴 ✓
- Sonner toast (alert() 대체) ✓

**플레이스홀더:** 없음 ✓

**타입 일관성:**
- `ProductOverride` → `lib/storage.ts`의 `lsGet`, `admin/page.tsx` 모두에서 동일 타입 사용 ✓
- `useCart().addItem(Product)` → `ProductCard`, `checkout`, `flash-product` 모두 동일 시그니처 ✓
- `Order` 타입 → `success/page.tsx`, `orders/page.tsx`, `admin/page.tsx` 동일 ✓
