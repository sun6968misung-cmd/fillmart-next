# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```powershell
pnpm dev          # dev server at http://localhost:3000
pnpm build        # production build
pnpm lint         # ESLint
pnpm tsc --noEmit # type-check
```

Stack: **Next.js 16 App Router · React 19 · Tailwind CSS v4 · shadcn/ui · TypeScript · pnpm**

---

## Architecture

### Provider hierarchy (app/layout.tsx)

```
StoreProvider (context/StoreProvider.tsx)
  └── ServerSyncProvider (components/ServerSyncProvider.tsx)
        └── Navbar · <main>{children}</main> · Footer · Toaster
```

`StoreProvider` holds Cart, Wishlist, Auth contexts in one file. Import `useCart`, `useWishlist`, `useAuth` directly from `@/context/StoreProvider` — the separate `hooks/` directory has been removed.

`ServerSyncProvider` fetches product overrides and custom products from Supabase via `GET /api/products` on every page load, overwrites localStorage, then fires `pilmart:products-changed` and `pilmart:store-synced`. It also runs `migrateCustomerPhone()` (`lib/migrations.ts`) once per browser (flagged by a localStorage key).

### Storage: localStorage (cache layer only)

All data is accessed via `lsGet<T>(key, fallback)` / `lsSet(key, val)` / `lsRemove(key)` from `lib/storage.ts`. Always use these helpers — never call `localStorage` directly.

`lsSet`/`lsRemove` are now pure localStorage operations — there is no automatic server sync side effect. `lib/serverSync.ts` and `/api/store` have been deleted.

#### Storage: localStorage (cache layer only)

All data is accessed via `lsGet`/`lsSet`/`lsRemove` from `lib/storage.ts`. `lsSet`/`lsRemove` are now pure localStorage operations — there is no automatic server sync side effect.

Product overrides and custom products are fetched from Supabase via `GET /api/products` on every page load (in `ServerSyncProvider`) and cached in localStorage. `lib/serverSync.ts` and `/api/store` have been deleted.

#### Storage key reference

| Key | Contents |
|---|---|
| `pilmart_cart` | `CartItem[]` |
| `pilmart_wishlist` | `string[]` of product IDs |
| `pilmart_session` | `Session` (30-day TTL) |
| `pilmart_pending_order` | Written before payment, cleared on success |
| `pilmart_admin_active` | (legacy) admin logged-in flag — no longer used after cookie auth |
| `pilmart_logo` | Base64 PNG |
| `pilmart_products` | `Record<id, ProductOverride>` — cached from Supabase via /api/products |
| `pilmart_custom_products` | `Product[]` — cached from Supabase via /api/products |
| `pilmart_users` | `StoredUser[]` — registered accounts (일반·카카오·네이버) |
| `pilmart_orders` | Completed orders (last 30) — synced via /api/orders |
| `pilmart_notices` | `Notice[]` — synced via /api/notices |
| `pilmart_flash_sale` | `FlashSaleConfig` — synced via /api/flash-sale |
| `pilmart_store_info` | `StoreInfo` — synced via /api/store-info |
| `pilmart_admin_pw` | (legacy) super admin pw hash — migrated to Supabase admin_accounts |
| `pilmart_admin_accounts` | (legacy) sub-admin list — migrated to Supabase admin_accounts |
| `pilmart_audit_logs` | (legacy) audit log cache — now stored in Supabase audit_logs table |

### Products (`lib/products.ts`)

`PRODUCTS` is a static array of ~60 items. `OVERRIDE_KEYS` lists every overridable field.

- **`getProducts()`** — store-facing; merges overrides + custom products, filters hidden.
- **`getAllProductsAdmin()`** — same but includes hidden.

`taxType` defaults to `'taxFree'`. `'tax'` items show VAT breakdown: supply = price ÷ 1.1, VAT = price − supply. This badge and breakdown appears on product detail, cart, checkout, orders, and admin order print.

### Admin page (`app/admin/page.tsx`)

Renders with `fixed inset-0 z-[9999]` — overlays the store layout.

#### Auth state restoration

On page load, `useEffect` checks `lsGet(KEYS.adminActive)`. If true, sets `authed(true)` and reads `sessionStorage.getItem('pilmart_admin_user')` to restore the logged-in sub-admin (and their role/tabs). Super-admin stores `'__super__'` as the sessionStorage value. Logout clears both `adminActive` and `sessionStorage`.

#### Tabs and roles

`Tab = 'dashboard' | 'orders' | 'products' | 'deals' | 'notices' | 'site' | 'members' | 'account' | 'logs'`

`ROLE_TABS`: `super` → all tabs; `product` → dashboard, products, deals; `order` → dashboard, orders.  
`members`, `account`, `logs` tabs have an extra `myRole === 'super'` content guard inside.

Login: empty username → single-password super-admin (backward compat). Username filled → looks up `adminAccounts`.

#### Order management

Clicking an order number opens a 상세 모달 with full info, per-item 면세/과세 badge, status dropdown, print, and delete. Print template includes customer name, phone, address, memo.

#### Audit log system

`addLog(action, target, detail?)` — prepends to state + localStorage, capped at 500. Covers: login, order status/delete, product edit/delete/restore, notice add/remove, flash config, store info, password change, admin account add/remove/toggle, member delete, data reset.

### Admin sub-pages

`/admin/member/[phone]` and `/admin/member/[phone]/day/[date]` are separate Next.js pages that use the **same `fixed inset-0 z-[9999]` overlay pattern** as the main admin page. They include `<AdminSidebar activeTab="members" />` (`components/admin/AdminSidebar.tsx`) on the left. Auth guard: `if (!lsGet(KEYS.adminActive, false)) router.replace('/admin')`.

`AdminSidebar` reads order count for the badge, handles logout (clears `adminActive` + `sessionStorage`), and navigates via `href="/admin#${tabId}"`.

### Auth (`app/auth/page.tsx`)

Registration requires: name, phone, address (Daum Postcode API), password. Password is SHA-256 hashed via `lib/crypto.ts`. `crypto.subtle` is unavailable on HTTP LAN IPs — login falls back to plaintext comparison on non-HTTPS origins.

Social login (Kakao/Naver): OAuth 2.0 implicit grant. Keys in `.env.local`:
```
NEXT_PUBLIC_KAKAO_APP_KEY=
NEXT_PUBLIC_NAVER_CLIENT_ID=
```

Social callbacks (`kakao-callback`, `naver-callback`) save to `pilmart_users` on first login (dedup by phone + provider).

### Payment flow

1. `checkout/page.tsx` — loads `StoredUser.address` as default delivery address. Two-tab selector: 기본 배송지 (read-only stored address) vs 다른 배송지 (Daum Postcode search). Writes `pilmart_pending_order` including `address`, `memo`, `customerName`, `customerPhone`.
2. Toss Payments SDK (online card/transfer) or direct redirect (만나서).
3. `success/page.tsx` — reads pending order → appends to `pilmart_orders` → `clearCart()`.

Toss key: `process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY` (currently test key).

### Orders (`app/orders/page.tsx`)

`Order` fields: `cancelledItems?: string[]`, `orderStatus?: '주문완료'|'배송준비중'|'배송중'|'배송완료'`, `customerPhone?`, `address?`, `memo?`. `배송완료` orders cannot be cancelled.

### Flash sale

`FlashSaleConfig = { startHour, endHour, products: FlashProduct[] }`. Section hidden outside active hours. `maxPerCustomer: 0` = unlimited. `product` role admins can manage.

### Routes

| Route | Purpose |
|---|---|
| `/` | Home: HeroBanner + FlashSaleSection + ProductGrid; `?cat=` filter |
| `/category/[slug]` | Category landing page; slug mapped via `lib/categoryConfig.ts` |
| `/product/[id]` | Detail: 상품정보/상품평/배송 tabs; taxType badge + VAT box |
| `/flash-product/[idx]` | Flash sale per-product detail |
| `/cart` | Cart with 면세/과세 breakdown |
| `/checkout` | Checkout with address selector and tax breakdown |
| `/orders` | Order history with partial cancel |
| `/admin` | Admin overlay (all tabs) |
| `/admin/member/[phone]` | Member detail: info card + daily order summaries |
| `/admin/member/[phone]/day/[date]` | Day detail: expandable order cards |
| `/auth` | Login/register (일반·사업자) |
| `/kakao-callback`, `/naver-callback` | OAuth |

### Patterns

- `useSearchParams()` pages need `<Suspense>`.
- Use `cn()` from the `cn` package (`import { cn } from "cn"`) for conditional classNames.
- Add shadcn/ui: `pnpm dlx shadcn@latest add <name>`.
- Event dispatches after data changes: `pilmart:logo-changed`, `pilmart:products-changed`.
- Admin overlay pages (and sub-pages) use `fixed inset-0 z-[9999] flex bg-gray-50` as root wrapper.
