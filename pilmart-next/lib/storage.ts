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
  users: 'pilmart_users',
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
