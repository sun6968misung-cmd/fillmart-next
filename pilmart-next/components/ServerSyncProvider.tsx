'use client';
import { useEffect } from 'react';
import { syncAllFromServer } from '@/lib/serverSync';

export function ServerSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    syncAllFromServer().then(() => {
      window.dispatchEvent(new CustomEvent('pilmart:products-changed'));
      window.dispatchEvent(new CustomEvent('pilmart:store-synced'));
    });
  }, []);
  return <>{children}</>;
}
