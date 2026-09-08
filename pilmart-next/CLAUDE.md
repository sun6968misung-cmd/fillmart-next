# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```powershell
pnpm dev          # start dev server at http://localhost:3000
pnpm build        # production build
pnpm lint         # ESLint
pnpm tsc --noEmit # type-check without emitting
```

Stack: **Next.js 16 App Router · React 19 · Tailwind CSS v4 · shadcn/ui · TypeScript · pnpm**

---

## Architecture

### Storage: localStorage + server-side JSON sync

All data lives in `localStorage` via `lib/storage.ts`. Always use `lsGet<T>(key, fallback)` / `lsSet(key, val)` / `lsRemove(key)` — never call `localStorage` directly.

**`lsSet` and `lsRemove` automatically sync shared keys to the server** (`/api/store`) via `lib/serverSync.ts`. This makes `localhost:3000` and `192.168.x.x:3000` share the same data. Never bypass `lsSet` for shared keys.

On every page load, `components/ServerSyncProvider.tsx` (mounted in `app/layout.tsx`) fetches all shared keys from the server and overwrites localStorage, then dispatches `pilmart:products-changed` and `pilmart:store-synced` events so components re-render.

#### Key categories

| Key | Shared to server | Contents |
|---|---|---|
| `pilmart_cart` | ❌ | `CartItem[]` |
| `pilmart_wishlist` | ❌ | `string[]` of product IDs |
| `pilmart_session` | ❌ | `Session` (30-day TTL) |
| `pilmart_pending_order` | ❌ | Written before payment, cleared on success |
| `pilmart_admin_active` | ❌ | `boolean` — set on admin login |
| `pilmart_products` | ✅ | `Record<id, ProductOverride>` — overrides + hidden flags |
| `pilmart_custom_products` | ✅ | `Product[]` — products added via Excel |
| `pilmart_users` | ✅ | `StoredUser[]` (registered accounts) |
| `pilmart_orders` | ✅ | Completed orders (last 30) |
| `pilmart_notices` | ✅ | `Notice[]` |
| `pilmart_flash_sale` | ✅ | `FlashSaleConfig` |
| `pilmart_store_info` | ✅ | `StoreInfo` |
| `pilmart_admin_pw` | ✅ | Admin password hash (default plaintext: `1234`) |

Server JSON files are stored in `data/` at the project root (created on first write).

### Products (`lib/products.ts`)

`PRODUCTS` is a static array of ~60 items. Two exported functions:

- **`getProducts()`** — for all store-facing components. Merges overrides, includes custom products, **filters out hidden products**.
- **`getAllProductsAdmin()`** — for the admin page only. Same as above but **includes hidden products** so they can be restored.

**`Product` fields added this session:** `detailImageUrl?`, `expiryDate?`, `productInfo?`, `customerServiceNo?`, `hidden?`

`getProductImage(id)` returns the effective image URL (admin override first, then `PRODUCT_IMAGES[id]`).

`ProductOverride` mirrors all editable fields including `hidden?: boolean`. The spread `{ ...product, ...override }` in both functions applies them all.

### Cross-client UI refresh

After any product mutation, call `notifyProductsChanged()` in the admin page. This dispatches `pilmart:products-changed`, which `app/page.tsx` listens to (via `productRev` state increment) to re-run `getProducts()`.

Components that read flash sale / notices also listen for `pilmart:store-synced` (dispatched by `ServerSyncProvider` after server sync).

### Admin page (`app/admin/page.tsx`)

Renders with `fixed inset-0 z-[9999]` to overlay the entire site. No separate route.

**Product management features:**
- Edit modal: image, detail image (상세페이지 하단이미지), category, name, prices, unit, origin, storage, expiry, product info, customer service no., description
- Excel import (`xlsx` library): download template → fill → upload → bulk upsert. New IDs go to `pilmart_custom_products`; existing IDs update overrides. Excel columns include `상세이미지URL`.
- Delete: individual (trash icon per row) or bulk ("전체 삭제"). Custom products are fully removed; static base products get `hidden: true` in their override.
- Restore: hidden products appear in a collapsible "숨겨진 상품" section below the table with "복원" buttons.
- After every product mutation call `setProducts(getAllProductsAdmin()); notifyProductsChanged();`

**Admin login on HTTP (192.168.x.x):** `crypto.subtle` is unavailable on non-HTTPS origins. The login function checks `canHash` and falls back to plaintext comparison, resetting any stored hash to `null` if needed.

### Global state (`context/StoreProvider.tsx`)

Three nested providers: `AuthProvider` → `CartProvider` → `WishlistProvider`. Consumed via:

```ts
import { useCart }     from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth }     from '@/hooks/useAuth';
```

Auth enforcement is in the context: `addItem` / `toggle` redirect to `/auth` if not logged in; `goCheckout` enforces 100,000원 minimum.

### Auth (`app/auth/page.tsx`)

Passwords hashed with Web Crypto SHA-256 (`lib/crypto.ts`). `StoredUser` has optional business fields: `userType`, `businessNo`, `businessName`, `businessType`, `businessCategory`.

**Social login** — Kakao and Naver use OAuth 2.0 implicit grant. Keys in `.env.local`:
```
NEXT_PUBLIC_KAKAO_APP_KEY=
NEXT_PUBLIC_NAVER_CLIENT_ID=
```
Callbacks: `app/kakao-callback/page.tsx`, `app/naver-callback/page.tsx`. Kakao app ID 1570390 has `http://localhost:3000` registered.

### Flash sale (`FlashSaleConfig`)

Stored as `{ startHour, endHour, products: FlashProduct[] }` in `pilmart_flash_sale`.
- Section hides entirely outside `startHour`–`endHour`.
- `maxPerCustomer: 0` = unlimited; `> 0` stored on cart item as `maxQty`.

### Product detail page (`app/product/[id]/ProductPageClient.tsx`)

In the "상품정보" tab, shows `product.detailImageUrl` if set (상세페이지 하단이미지), otherwise falls back to the main product image. Set via the admin product edit modal or Excel `상세이미지URL` column.

상품 고시정보 table shows: 포장단위, 원산지, 보관방법, 소비기한(`expiryDate`), 상품구성, 소비자상담(`customerServiceNo`).

### Payment flow

1. `checkout/page.tsx` collects address (Daum Postcode) and writes `pilmart_pending_order`.
2. Toss Payments SDK or direct redirect for 만나서 methods.
3. `success/page.tsx` reads pending order, appends to `pilmart_orders` (auto-syncs to server via `lsSet`), calls `clearCart()`.

Toss client key: `process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY` (currently test key).

### Routes

| Route | Purpose |
|---|---|
| `/` | Home: HeroBanner + FlashSaleSection + ProductGrid; `?cat=` shows filter sidebar |
| `/product/[id]` | Product detail with 상품정보/상품평/배송 tabs |
| `/category/[slug]` | Category promo page |
| `/flash-product/[idx]` | Flash sale product detail |
| `/cart` | Full-page cart |
| `/checkout` | Checkout with Daum Postcode |
| `/admin` | Admin dashboard (overlay) |
| `/auth` | Login / register (일반 or 사업자) |
| `/orders`, `/wishlist` | Order history, wishlist |
| `/notice`, `/faq`, `/contact`, `/terms`, `/privacy` | Info pages |
| `/success`, `/fail` | Toss payment callbacks |
| `/kakao-callback`, `/naver-callback` | OAuth callbacks |
| `/api/store` | GET/POST shared data (server-side JSON files in `data/`) |

### Home page product grid (`app/page.tsx`)

`allProducts` is memoized with a `productRev` counter. To force a re-read after localStorage changes, dispatch `pilmart:products-changed`. The page already has a listener wired up.

`ProductGrid` (`components/product/ProductGrid.tsx`) shows categories in `CATEGORY_ORDER` sequence, 4×2 (8 items) per section with "더보기 →" links.

### Patterns

- Pages using `useSearchParams()` must be wrapped in `<Suspense>`.
- Use `cn()` from `lib/utils.ts` for conditional classNames.
- Add shadcn/ui: `pnpm dlx shadcn@latest add <name>`; components live in `components/ui/`.
- New `KEYS` entry → add to `lib/storage.ts`, add to `SHARED_KEYS` in `lib/serverSync.ts` if cross-client, update admin "계정/데이터" reset list.
- `crypto.subtle` is only available on HTTPS or `localhost`. Never assume it exists on HTTP LAN IPs.
