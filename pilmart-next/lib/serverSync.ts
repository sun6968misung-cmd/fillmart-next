export const SHARED_KEYS = new Set([
  'pilmart_products',
  'pilmart_custom_products',
  'pilmart_notices',
  'pilmart_flash_sale',
  'pilmart_store_info',
  'pilmart_orders',
  'pilmart_admin_pw',
  'pilmart_users',
]);

export async function serverSet(key: string, value: unknown): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch(`/api/store?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
  } catch {
    // localStorage already updated — server sync failed silently
  }
}

export async function syncAllFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  await Promise.all(
    Array.from(SHARED_KEYS).map(async key => {
      try {
        const res = await fetch(`/api/store?key=${encodeURIComponent(key)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data !== null) {
          localStorage.setItem(key, JSON.stringify(data));
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        // ignore — keep existing localStorage value
      }
    })
  );
}
