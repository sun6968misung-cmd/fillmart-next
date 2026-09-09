# Task 3: 상태 관리 (Context + Hooks)

## Context
Tasks 1-2에서 Next.js 프로젝트와 타입/데이터 레이어가 완성됐다.
이 태스크는 Alpine.js 스토어 3개(cart, wishlist, auth)를 React Context + custom hooks로 대체하고, Toss 결제 훅을 추가한다.

## Global Constraints
- 작업 디렉터리: `C:\Users\USER\.antigravity-ide\pilmart-next\`
- localStorage 키 변경 금지: `pilmart_cart`, `pilmart_wishlist`, `pilmart_session`
- TypeScript strict 모드 (any 금지)
- 모든 클라이언트 컴포넌트 상단에 `'use client'` 선언
- `NEXT_PUBLIC_TOSS_CLIENT_KEY` 환경변수 사용

## Files to Create

### 1. `pilmart-next/context/StoreProvider.tsx`

이 파일이 Cart, Wishlist, Auth Context를 모두 포함하고, hook들도 export한다.

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

### 2. `pilmart-next/hooks/useTossPayment.ts`

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

### 3. `pilmart-next/hooks/useCart.ts` (re-export)

```typescript
export { useCart } from '@/context/StoreProvider';
```

### 4. `pilmart-next/hooks/useWishlist.ts` (re-export)

```typescript
export { useWishlist } from '@/context/StoreProvider';
```

### 5. `pilmart-next/hooks/useAuth.ts` (re-export)

```typescript
export { useAuth } from '@/context/StoreProvider';
```

## Verification
```powershell
cd C:\Users\USER\.antigravity-ide\pilmart-next
pnpm tsc --noEmit
```
오류 없음 확인.

## Git Commit
```powershell
cd C:\Users\USER\.antigravity-ide
git add pilmart-next/context/ pilmart-next/hooks/
git commit -m "feat: add React Context state management (cart, wishlist, auth) + Toss payment hook"
```

## Report File
`C:\Users\USER\.antigravity-ide\.superpowers\sdd\2026-09-07-pilmart-nextjs-shadcn\task-3-report.md`
