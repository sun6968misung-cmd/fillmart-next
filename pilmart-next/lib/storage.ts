import { SHARED_KEYS, serverSet } from '@/lib/serverSync';

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
  adminActive: 'pilmart_admin_active',
  users: 'pilmart_users',
  customProducts: 'pilmart_custom_products',
  adminAccounts: 'pilmart_admin_accounts',
  auditLogs: 'pilmart_audit_logs',
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
  if (SHARED_KEYS.has(key)) {
    serverSet(key, value).catch(() => {});
  }
}

export function lsRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
  if (SHARED_KEYS.has(key)) {
    serverSet(key, null).catch(() => {});
  }
}
