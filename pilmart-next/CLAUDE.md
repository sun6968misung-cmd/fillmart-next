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

`ServerSyncProvider` fetches product overrides and custom products from Supabase via `GET /api/products` on every page load, caches them to localStorage, then fires `pilmart:products-changed` and `pilmart:store-synced`. Also runs `migrateCustomerPhone()` once per browser.

### Storage (`lib/storage.ts`)

All data is accessed via `lsGet<T>(key, fallback)` / `lsSet(key, val)` / `lsRemove(key)` — never call `localStorage` directly. `lsSet`/`lsRemove` are pure localStorage operations with no server side effects.

| Key | Contents |
|---|---|
| `pilmart_cart` | `CartItem[]` |
| `pilmart_wishlist` | `string[]` of product IDs |
| `pilmart_session` | Customer `Session` (30-day TTL) |
| `pilmart_pending_order` | Written before payment, cleared on success |
| `pilmart_logo` | Base64 PNG |
| `pilmart_products` | `Record<id, ProductOverride>` — Supabase cache via `/api/products` |
| `pilmart_custom_products` | `Product[]` — Supabase cache via `/api/products` |
| `pilmart_users` | `StoredUser[]` — registered customer accounts |
| `pilmart_orders` | Completed orders (last 30) |
| `pilmart_notices` | `Notice[]` cache |
| `pilmart_flash_sale` | `FlashSaleConfig` cache |
| `pilmart_store_info` | `StoreInfo` cache |

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
| `/api/admin/orders` | requireAdmin | GET (excludes `status='삭제됨'`) / PATCH / DELETE (single: hard; all: soft) |
| `/api/admin/members` | requireAdmin | GET / DELETE |
| `/api/products` | GET public, writes requireAdmin | GET→`{overrides, customs}` / POST custom / PATCH override / DELETE hide\|show\|remove |
| `/api/notices` | GET public, POST/DELETE requireAdmin | |
| `/api/flash-sale` | GET public, POST requireAdmin | |
| `/api/store-info` | GET public, POST requireAdmin | |

### Admin sub-pages

`/admin/member/[phone]` and `/admin/member/[phone]/day/[date]` use the same `fixed inset-0 z-[9999]` overlay. They include `<AdminSidebar activeTab="members" />`.

Auth guard uses `GET /api/admin/session` (cookie-based). `AdminSidebar` logout calls `POST /api/admin/logout`.

### Customer auth (`app/auth/page.tsx`)

Registration: name, phone, Daum Postcode address, password (SHA-256 via `lib/crypto.ts`). Social login (Kakao/Naver) via OAuth 2.0 implicit grant; keys in `.env.local` as `NEXT_PUBLIC_KAKAO_APP_KEY` and `NEXT_PUBLIC_NAVER_CLIENT_ID`.

### Payment flow

1. `checkout/page.tsx` writes `pilmart_pending_order` (includes address, memo, customerName, customerPhone).
2. Toss Payments SDK → `success.html` or direct redirect for 만나서 payment.
3. `success/page.tsx` reads pending order → appends to orders → `clearCart()`.

Toss key: `NEXT_PUBLIC_TOSS_CLIENT_KEY` (currently test key).

### Flash sale

`FlashSaleConfig = { startHour, endHour, products: FlashProduct[] }`. Section hidden outside active hours. `maxPerCustomer: 0` = unlimited.

### Supabase tables

`product_overrides` (TEXT PK: product_id), `custom_products`, `admin_accounts` (bcrypt, `__super__` row always present), `audit_logs` (auto-trimmed to 1000 rows via trigger), `orders`, `profiles`, `notices`, `flash_sale`, `store_info`.

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
