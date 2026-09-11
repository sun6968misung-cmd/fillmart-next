import { lsGet, lsSet, KEYS } from '@/lib/storage';
import { Order, StoredUser } from '@/types';

const DONE_KEY = 'pilmart_migration_v1_customer_phone';

/**
 * 기존 주문의 customerPhone 공백을 채운다.
 * customerName → users 이름 역방향 매칭. 동명이인이면 건너뜀.
 * 완료 후 플래그를 저장해 재실행을 막는다.
 */
export function migrateCustomerPhone(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(DONE_KEY) === '1') return;

  const orders = lsGet<Order[]>(KEYS.orders, []);
  const users  = lsGet<StoredUser[]>(KEYS.users, []);

  // 이름 → 유일하게 매핑 가능한 전화번호 맵 (동명이인 제외)
  const nameToPhone = new Map<string, string | null>();
  for (const u of users) {
    if (nameToPhone.has(u.name)) {
      nameToPhone.set(u.name, null); // 동명이인 → null로 표시
    } else {
      nameToPhone.set(u.name, u.phone);
    }
  }

  let changed = false;
  const patched = orders.map(o => {
    if (o.customerPhone) return o;            // 이미 있으면 건너뜀
    const phone = o.customerName ? nameToPhone.get(o.customerName) : undefined;
    if (!phone) return o;                     // 매칭 불가 또는 동명이인
    changed = true;
    return { ...o, customerPhone: phone };
  });

  if (changed) lsSet(KEYS.orders, patched);
  localStorage.setItem(DONE_KEY, '1');
}
