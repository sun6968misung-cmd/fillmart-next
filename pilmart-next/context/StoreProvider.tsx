'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { CartItem, Product, Session } from '@/types';
import { KEYS, lsGet, lsSet, lsRemove } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ── Cart ──────────────────────────────────────────────────────────────
interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: Product) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  goCheckout: () => void;
}
const CartContext = createContext<CartCtx | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    setItems(lsGet<CartItem[]>(KEYS.cart, []));
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    lsSet(KEYS.cart, next);
  }, []);

  const addItem = useCallback((product: Product) => {
    const session = lsGet<Session | null>(KEYS.session, null);
    if (!session) { router.push('/auth'); return; }
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      const next = existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
      lsSet(KEYS.cart, next);
      return next;
    });
    router.push('/cart');
    toast.success(`${product.name} 담았습니다`);
  }, [router]);

  const updateQty = useCallback((id: string, delta: number) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item && delta > 0 && item.maxQty && item.qty >= item.maxQty) {
        toast.error(`1인 최대 ${item.maxQty}개까지 구매 가능합니다.`);
        return prev;
      }
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
    router.push('/checkout');
  }, [items, router]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, count, total,
      addItem, updateQty, removeItem, clearCart,
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
  const router = useRouter();

  useEffect(() => {
    setIds(lsGet<string[]>(KEYS.wishlist, []));
  }, []);

  const toggle = useCallback((id: string) => {
    const session = lsGet<Session | null>(KEYS.session, null);
    if (!session) { router.push('/auth'); return; }
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      lsSet(KEYS.wishlist, next);
      return next;
    });
  }, [router]);

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
