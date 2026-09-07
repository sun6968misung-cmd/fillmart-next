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

### No backend — localStorage only

All data lives in `localStorage` via `lib/storage.ts`. Always use `lsGet<T>(key, fallback)` / `lsSet(key, val)` — never call `localStorage.getItem()` directly. `localStorage.getItem()` returns raw JSON with surrounding quotes; `lsGet` JSON-parses it correctly.

Keys defined in `KEYS`:

| Key | Contents |
|---|---|
| `pilmart_cart` | `CartItem[]` |
| `pilmart_wishlist` | `string[]` of product IDs |
| `pilmart_session` | `Session` (30-day TTL) |
| `pilmart_users` | `StoredUser[]` (registered accounts) |
| `pilmart_orders` | Completed orders (last 30) |
| `pilmart_pending_order` | Written before payment, cleared on success |
| `pilmart_products` | Admin price/name/image overrides merged onto `PRODUCTS` |
| `pilmart_notices` | `Notice[]` |
| `pilmart_flash_sale` | `FlashSaleConfig` |
| `pilmart_store_info` | `StoreInfo` |
| `pilmart_admin_pw` | Admin password hash (default plaintext: `1234`) |

### Products (`lib/products.ts`)

`PRODUCTS` is a static array of 26 items. `getProducts()` merges admin overrides from `pilmart_products`. Always call `getProducts()` — never reference `PRODUCTS` directly in components.

`getProductImage(id)` returns the admin-uploaded image URL for a product (or `undefined`).

### Global state (`context/StoreProvider.tsx`)

Three nested providers: `AuthProvider` → `CartProvider` → `WishlistProvider`. All three are consumed via re-exported hooks:

```ts
import { useCart }     from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth }     from '@/hooks/useAuth';
```

**Auth enforcement is in the context, not the component:**
- `addItem` — checks session, redirects to `/auth` if not logged in; on success navigates to `/cart`.
- `toggle` (wishlist) — same auth check.
- `goCheckout` — enforces 100,000원 minimum; navigates to `/checkout`.

### Auth (`app/auth/page.tsx`)

Passwords are hashed with Web Crypto SHA-256 (`lib/crypto.ts`). Users stored in `pilmart_users` as `StoredUser[]`. `StoredUser` has optional business fields: `userType`, `businessNo`, `businessName`, `businessType`, `businessCategory`.

The admin password gate in `app/admin/page.tsx` reads the stored value with `lsGet<string>(KEYS.adminPw, '1234')`. If the value is a 64-char hex string it compares hashes; otherwise compares plaintext and migrates to hash on first match.

### Flash sale (`FlashSaleConfig`)

Stored as `{ startHour, endHour, products: FlashProduct[] }` in `pilmart_flash_sale`.

- Section hides entirely outside `startHour`–`endHour` window.
- `maxPerCustomer: 0` means unlimited. `> 0` means limited — stored on the cart item as `maxQty`.
- `updateQty` blocks increment when `item.qty >= item.maxQty`.

### Category pages (`lib/categoryConfig.ts`)

`CATEGORY_CONFIGS` maps slugs → display config. Valid slugs: `vegetables`, `sauce`, `meat`, `seafood`, `grain`. Each maps to a `category` string on `Product`. Extend this file to add new category pages.

Valid `category` strings on products: `야채/채소`, `과일`, `축산/계란`, `수산/건어물`, `라면/면류`, `유제품/냉장/냉동`, `캔/통조림`, `고추장/된장/간장류`, `쌀/잡곡`.

### Admin page (`app/admin/page.tsx`)

Renders with `fixed inset-0 z-[9999]` to overlay the entire site. No separate route. `CartSheet` is a no-op stub — the cart is now a full page at `/cart`.

### Payment flow

1. `checkout/page.tsx` collects address (Daum Postcode API: `window.daum.Postcode`) and writes `pilmart_pending_order` with `customerName`.
2. Toss Payments SDK (`useTossPayment` hook) or direct redirect for 만나서 methods.
3. `success/page.tsx` reads pending order, appends to `pilmart_orders`, calls `clearCart()`.
4. `fail/page.tsx` handles Toss failure callbacks.

Toss client key: `process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY` (currently test key).

### Routes

| Route | Purpose |
|---|---|
| `/` | Home: HeroBanner + FlashSaleSection + ProductGrid; `?cat=` shows filter sidebar |
| `/product/[id]` | Product detail |
| `/category/[slug]` | Category promo page |
| `/flash-product/[idx]` | Flash sale product detail |
| `/cart` | Full-page cart |
| `/checkout` | Checkout with Daum Postcode address search |
| `/admin` | Admin dashboard (overlay) |
| `/auth` | Login / register (일반 or 사업자) |
| `/orders`, `/wishlist` | Order history, wishlist |
| `/notice`, `/faq`, `/contact`, `/terms`, `/privacy` | Info pages |
| `/success`, `/fail` | Toss payment callbacks |
| `/naver-callback` | Naver OAuth callback (stub) |

### Patterns to follow

- Pages using `useSearchParams()` must be wrapped in `<Suspense>` — Next.js App Router requires it.
- Use `cn()` from `lib/utils.ts` for conditional classNames.
- Add shadcn/ui components with `pnpm dlx shadcn@latest add <component-name>`; they live in `components/ui/`.
