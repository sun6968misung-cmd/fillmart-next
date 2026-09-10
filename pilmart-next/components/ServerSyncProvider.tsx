'use client';
import { useEffect } from 'react';
import { lsSet, KEYS } from '@/lib/storage';
import { migrateCustomerPhone } from '@/lib/migrations';
import type { Product, ProductOverride } from '@/types';

export function ServerSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((data: { overrides: Record<string, ProductOverride>; customs: Product[] } | null) => {
        if (!data) return;
        lsSet(KEYS.products, data.overrides);
        lsSet(KEYS.customProducts, data.customs);
      })
      .then(() => {
        migrateCustomerPhone();
        window.dispatchEvent(new CustomEvent('pilmart:products-changed'));
        window.dispatchEvent(new CustomEvent('pilmart:store-synced'));
      })
      .catch(() => {
        window.dispatchEvent(new CustomEvent('pilmart:products-changed'));
        window.dispatchEvent(new CustomEvent('pilmart:store-synced'));
      });
  }, []);
  return <>{children}</>;
}
