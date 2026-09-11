'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { CartItem, Product, Session } from '@/types';
import { KEYS, lsGet, lsSet, lsRemove } from '@/lib/storage';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ── Cart ──────────────────────────────────────────────────────────────
interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: Product, qty?: number) => void;
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

  const addItem = useCallback((product: Product, qty = 1) => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return; }
      setItems(prev => {
        const existing = prev.find(i => i.id === product.id);
        const next = existing
          ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
          : [...prev, { ...product, qty }];
        lsSet(KEYS.cart, next);
        return next;
      });
      router.push('/cart');
      toast.success(`${product.name} 담았습니다`);
    });
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
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth?redirect=/checkout'); return; }
      router.push('/checkout');
    });
  }, [items, router]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, updateQty, removeItem, clearCart, goCheckout }}>
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

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        try {
          const res = await fetch('/api/wishlist');
          if (res.ok) {
            const { product_ids } = await res.json() as { product_ids: string[] };
            setIds(prev => {
              const merged = [...new Set([...prev, ...product_ids])];
              lsSet(KEYS.wishlist, merged);
              return merged;
            });
          }
        } catch { /* localStorage 상태 유지 */ }
      }
      if (event === 'SIGNED_OUT') {
        setIds([]);
        lsRemove(KEYS.wishlist);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggle = useCallback((id: string) => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return; }
      setIds(prev => {
        const adding = !prev.includes(id);
        const next = adding ? [...prev, id] : prev.filter(x => x !== id);
        lsSet(KEYS.wishlist, next);
        void fetch('/api/wishlist', {
          method: adding ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: id }),
        });
        return next;
      });
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

function toSession(sbUser: User | null): Session | null {
  if (!sbUser) return null;
  return {
    name: sbUser.user_metadata?.name ?? '',
    phone: sbUser.user_metadata?.phone ?? '',
    loginAt: Date.now(),
    provider: sbUser.user_metadata?.provider ?? 'local',
  };
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(toSession(user)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toSession(session?.user ?? null));
    });
    return () => subscription.unsubscribe();
  }, []);

  // 소셜 콜백에서 즉시 UI 반영 용도로 유지
  const login = useCallback((session: Session) => { setUser(session); }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
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
