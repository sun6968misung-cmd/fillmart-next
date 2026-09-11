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

### Provider hierarchy (`app/layout.tsx`)

```
StoreProvider (context/StoreProvider.tsx)
  └── ServerSyncProvider (components/ServerSyncProvider.tsx)
        └── Navbar · <main>{children}</main> · Footer · Toaster
```

`StoreProvider` holds Cart, Wishlist, Auth contexts. Import `useCart`, `useWishlist`, `useAuth` directly from `@/context/StoreProvider` — the separate `hooks/` directory has been removed.

`ServerSyncProvider` fetches product overrides and custom products from Supabase via `GET /api/products` on every page load, caches them to localStorage, then fires `pilmart:products-changed` and `pilmart:store-synced`. Also runs `migrateCustomerPhone()` (from `lib/migrations.ts`) once per browser. Events are also dispatched in the `.catch()` branch so listeners always fire.

### Storage (`lib/storage.ts`)

All data is accessed via `lsGet<T>(key, fallback)` / `lsSet(key, val)` / `lsRemove(key)` — never call `localStorage` directly.

| Key | Contents | Status |
|---|---|---|
| `pilmart_cart` | `CartItem[]` | Active |
| `pilmart_wishlist` | `string[]` of product IDs | Active |
| `pilmart_pending_order` | Written before payment, cleared on success | Active |
| `pilmart_products` | `Record<id, ProductOverride>` — Supabase cache via `/api/products` | Active |
| `pilmart_custom_products` | `Product[]` — Supabase cache via `/api/products` | Active |
| `pilmart_logo` | Base64 PNG | Active |
| `pilmart_users` | `StoredUser[]` — read by `migrateCustomerPhone()` only | Legacy (not written) |
| `pilmart_session` | Customer session | Legacy (Supabase auth handles sessions) |
| `pilmart_orders` | Completed orders | Legacy (orders now in Supabase) |
| `pilmart_notices` | `Notice[]` cache | Legacy |
| `pilmart_flash_sale` | `FlashSaleConfig` cache | Legacy |
| `pilmart_store_info` | `StoreInfo` cache | Legacy |

### Products (`lib/products.ts`)

`PRODUCTS` is a static array of ~60 base items. `getProducts()` merges Supabase overrides + custom products and filters hidden items (store-facing). `getAllProductsAdmin()` includes hidden items.

`taxType` defaults to `'taxFree'`. `'tax'` items show VAT breakdown (supply = price ÷ 1.1) on product detail, cart, checkout, orders, and admin print.

### Admin authentication (`lib/admin-session.ts`)

Admin auth uses HMAC-SHA256 signed session cookies (`admin_session`, HttpOnly, SameSite=Strict, 24h). The session payload is `{ username, role }`.

```typescript
// In any server route handler:
const authResult = await requireAdmin(req)   // → AdminSession | Response(401)
if (authResult instanceof Response) return authResult

const authResult = await requireSuper(req)   // → AdminSession | Response(401/403)
if (authResult instanceof Response) return authResult
```

All routes using `requireAdmin`/`requireSuper` or `bcryptjs` must declare `export const runtime = 'nodejs'` (bcrypt requires Node.js, not Edge).

Password storage: bcrypt cost 12. Login route auto-upgrades SHA-256 hex hashes to bcrypt on first login (legacy migration path). `__PENDING__` bootstrap accepts '1234' only.

### Admin page (`app/admin/page.tsx`)

Renders with `fixed inset-0 z-[9999]` — overlays the store layout.

#### Auth and session restore

On mount, `useEffect` fetches `GET /api/admin/accounts` (super-only), chains into `GET /api/admin/session` to restore the logged-in session from the cookie. Login calls `POST /api/admin/login`; logout calls `POST /api/admin/logout` + clears React state.

#### Tabs and roles

`Tab = 'dashboard' | 'orders' | 'products' | 'deals' | 'notices' | 'site' | 'members' | 'account' | 'logs'`

`ROLE_TABS`: `super` → all tabs; `product` → dashboard, products, deals; `order` → dashboard, orders.  
`members`, `account`, `logs` have an extra `myRole === 'super'` content guard.

#### Audit log

`addLog(action, target, detail?)` fire-and-forgets `POST /api/admin/logs`. The server extracts the actor from the session cookie — do not send an `actor` field in the body.

#### Destructive action pattern

`window.confirm` is prohibited. Use inline confirm state (e.g. `confirmDeleteId`, `confirmClearLogs`). Irreversible actions (전체 삭제, 데이터 초기화) additionally require typing the store name (`storeInfo.name`) into an input before the confirm button enables.

#### Admin order status values

The admin UI displays labels (`'결제완료'`, `'준비중'`, `'배송중'`, `'완료'`, `'취소'`) that map to the DB Korean strings (`'주문완료'`, `'배송준비중'`, `'배송중'`, `'배송완료'`, `'취소완료'`). Always use the DB Korean strings when writing to Supabase. `'삭제됨'` is a soft-delete status (excluded from admin GET, used in all-orders soft DELETE).

### Admin API routes

All admin API routes require `export const runtime = 'nodejs'`.

| Route | Auth | Methods |
|---|---|---|
| `/api/admin/login` | public | POST — bcrypt + SHA-256 rehash + `__PENDING__` bootstrap |
| `/api/admin/logout` | public | POST — clears cookie |
| `/api/admin/session` | public | GET — returns `{ username, role }` or 401 |
| `/api/admin/accounts` | requireSuper | GET/POST/PATCH/DELETE — PATCH supports `{ selfPw: true, newPassword }` for own pw |
| `/api/admin/logs` | requireAdmin | GET (latest 500) / POST (no DELETE endpoint) |
| `/api/admin/migrate` | requireSuper | POST — one-time localStorage→Supabase migration |
| `/api/admin/orders` | requireAdmin | GET (excludes `status='삭제됨'`) / PATCH / DELETE (single: hard; all: soft `status='삭제됨'`) |
| `/api/admin/members` | requireAdmin | GET / DELETE |
| `/api/products` | GET public, writes requireAdmin | GET→`{overrides, customs}` / POST custom / PATCH override / DELETE hide\|show\|remove |
| `/api/notices` | GET public, POST/DELETE requireAdmin | |
| `/api/flash-sale` | GET public, POST requireAdmin | |
| `/api/store-info` | GET public, POST requireAdmin | |

### Admin sub-pages

`/admin/member/[phone]` and `/admin/member/[phone]/day/[date]` use the same `fixed inset-0 z-[9999]` overlay. They include `<AdminSidebar activeTab="members" />`.

Auth guard uses `GET /api/admin/session` (cookie-based). `AdminSidebar` logout calls `POST /api/admin/logout`.

### Customer auth (`app/auth/page.tsx`)

**All customer auth goes through Supabase Auth** — `pilmart_users`/`pilmart_session` localStorage are not used.

- **Login**: `supabase.auth.signInWithPassword({ email: '${phone}@pilmart.com', password })`
- **Registration**: `POST /api/auth/signup` (server creates user via `admin.createUser` + `profiles.upsert`) → client calls `signInWithPassword()`
- **Kakao**: OAuth implicit grant → `accessToken` → `/kakao-callback` → email `${phone}@kakao.pilmart.com`, password `kko_${id}_pilmart`
- **Naver**: OAuth implicit grant → `accessToken` → `/naver-callback` → email `${phone}@naver.pilmart.com`, password `nv_${id}_pilmart`

Social callbacks try `signInWithPassword` first; on failure `signUp` then `signInWithPassword`. `profiles.id` = `auth.users.id` (UUID, FK cascade).

`StoreProvider` Auth watches `supabase.auth.onAuthStateChange()` and exposes a `Session { name, phone, loginAt, provider }` derived from `user.user_metadata`.

### Payment flow

1. `checkout/page.tsx` calls `POST /api/orders/pending` → creates an `orders` row with `status: '결제대기'` and `pending_expires_at: now + 30min`. Writes snapshot to `pilmart_pending_order` localStorage.
2. Toss widget → redirects to `/success?paymentKey=…&orderId=…&amount=…` (online) or `/success?method=meet-card|meet-cash&orderId=…&amount=…` (만나서).
3. `success/page.tsx` calls `POST /api/payments/confirm` → server confirms with Toss API → updates `orders.status` to `'주문완료'`. Clears cart and `pilmart_pending_order` on success.

**Confirm API (`app/api/payments/confirm/route.ts`) details:**
- Optimistic lock: `UPDATE orders SET payment_key='__confirming__' WHERE payment_key IS NULL` — prevents duplicate confirm.
- Meet payments (`meet-card`, `meet-cash`) skip Toss API entirely.
- `ALREADY_PAID_CODES = ['ALREADY_PROCESSED_PAYMENT']` — Toss "already processed" codes fall through to success (fill from sandbox double-confirm test if different).
- On network timeout: releases lock (`payment_key = null`). On Toss failure: sets `status = '취소완료'`.

**`success/page.tsx`:** Shows guest vs member CTA. Guests see order key + link to `/orders/lookup`. Members see "주문내역 보기".

Toss keys: `NEXT_PUBLIC_TOSS_CLIENT_KEY` (client), `TOSS_SECRET_KEY` (server confirm) — both currently test keys.

### Orders table

Columns: `id` (UUID PK), `order_key` (TEXT UNIQUE — human-readable `pilmart_…` key), `payment_key` (TEXT — Toss paymentKey or `__confirming__` sentinel or meet method name), `pending_expires_at` (TIMESTAMPTZ — cleared on confirm), `status` CHECK `('결제대기'|'주문완료'|'배송준비중'|'배송중'|'배송완료'|'취소완료'|'삭제됨')`.

Admin orders `GET` lazy-expires `결제대기` rows past `pending_expires_at` before returning the list.

**Partial cancel** (`orders/page.tsx` → `doCancel()`): client-side Supabase UPDATE `{ cancelled_items, total_amount }` via anon key + RLS. No Toss refund API called. Blocked on `'배송완료'` and `'취소완료'`.

### Flash sale

`FlashSaleConfig = { startHour, endHour, products: FlashProduct[] }`. Section hidden outside active hours. `maxPerCustomer: 0` = unlimited.

### Customer API routes

| Route | Auth | Methods |
|---|---|---|
| `/api/auth/signup` | public | POST — server creates Supabase user + profile |
| `/api/orders/pending` | Supabase session | POST — creates `결제대기` order row, returns `{ orderId }` |
| `/api/payments/confirm` | public (orderId in body) | POST — confirms Toss or meet payment, updates status to `주문완료` |
| `/api/orders/lookup` | public (rate-limited) | POST — guest order lookup by `{ order_key, phone_last4 }` |
| `/api/wishlist` | Supabase session | GET / POST `{ product_id }` / DELETE `{ product_id }` |

### Supabase tables

`product_overrides` (TEXT PK: product_id), `custom_products`, `admin_accounts` (bcrypt, `__super__` row always present), `audit_logs` (auto-trimmed to 1000 rows via trigger), `orders`, `profiles`, `notices`, `flash_sale`, `store_info`, `wishlists`.

`profiles` columns: `id` (uuid = auth.users.id), `phone`, `name`, `address`, `user_type` (`'personal'|'business'`), `business_no`, `business_name`, `business_type`, `business_category`, `provider`, `created_at`.

`createServiceClient()` from `lib/supabase-server.ts` — server-side only, never import in client components.

### Routes

| Route | Purpose |
|---|---|
| `/` | Home: HeroBanner + FlashSaleSection + ProductGrid; `?cat=` filter |
| `/category/[slug]` | Category landing; slug mapped via `lib/categoryConfig.ts` |
| `/product/[id]` | Detail: 상품정보/상품평/배송 tabs; taxType badge + VAT box |
| `/flash-product/[idx]` | Flash sale per-product detail |
| `/cart` | Cart with 면세/과세 breakdown |
| `/checkout` | Checkout with address selector and tax breakdown |
| `/orders` | Order history with partial cancel |
| `/orders/lookup` | Guest order lookup by order key + phone last 4 digits |
| `/success` | Payment result: guest CTA (order key + lookup link) or member CTA |
| `/admin` | Admin overlay (all tabs) |
| `/admin/member/[phone]` | Member detail: info card + daily order summaries |
| `/admin/member/[phone]/day/[date]` | Day detail: expandable order cards |
| `/auth` | Login/register (일반·사업자) |
| `/kakao-callback`, `/naver-callback` | OAuth callbacks |

### Patterns

- `useSearchParams()` pages need `<Suspense>`.
- Use `cn()` from the `cn` package (`import { cn } from "cn"`) for conditional classNames.
- Add shadcn/ui: `pnpm dlx shadcn@latest add <name>`.
- Event dispatches after data changes: `pilmart:logo-changed`, `pilmart:products-changed`.
- Admin overlay pages use `fixed inset-0 z-[9999] flex bg-gray-50` as root wrapper.
- Category values in use: `야채/채소`, `과일`, `축산/계란`, `수산/건어물`, `라면/면류`, `유제품/냉장/냉동`, `캔/통조림`.
