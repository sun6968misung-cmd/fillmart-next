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
| `pilmart_products` | `Record<id, ProductOverride>` — merged onto `PRODUCTS` at runtime |
| `pilmart_notices` | `Notice[]` |
| `pilmart_flash_sale` | `FlashSaleConfig` |
| `pilmart_store_info` | `StoreInfo` |
| `pilmart_admin_pw` | Admin password hash (default plaintext: `1234`) |
| `pilmart_admin_active` | `boolean` — set on admin login, cleared on logout |

### Products (`lib/products.ts`)

`PRODUCTS` is a static array of ~60 items. `getProducts()` merges admin overrides from `pilmart_products`. Always call `getProducts()` — never reference `PRODUCTS` directly in components.

`getProductImage(id)` returns the current effective image URL (admin override first, then `PRODUCT_IMAGES[id]`).

`ProductOverride` covers all editable fields: `name`, `price`, `originalPrice`, `imageUrl`, `category`, `desc`, `unit`, `origin`, `storage`. The spread `{ ...product, ...override }` in `getProducts()` applies them all.

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

The admin password gate reads with `lsGet<string>(KEYS.adminPw, '1234')`. If the stored value is a 64-char hex string it compares hashes; otherwise compares plaintext and migrates to hash on first successful match.

### Admin session (`pilmart_admin_active`)

Set to `true` when admin logs in, removed on logout. Components can read `lsGet<boolean>(KEYS.adminActive, false)` to detect admin mode. Currently used by `app/product/[id]/page.tsx` to show the "관리자 편집" button in the breadcrumb.

### Admin page (`app/admin/page.tsx`)

Renders with `fixed inset-0 z-[9999]` to overlay the entire site. No separate route. Product editing uses a modal overlay (`z-[10001]`) that covers all fields: image URL (live preview), category, name, prices, unit, origin, storage, description. The product table shows thumbnails and an orange reset button only when an override exists for that product.

`CartSheet` is a no-op stub — the cart is a full page at `/cart`.

### Flash sale (`FlashSaleConfig`)

Stored as `{ startHour, endHour, products: FlashProduct[] }` in `pilmart_flash_sale`.

- Section hides entirely outside `startHour`–`endHour` window.
- `maxPerCustomer: 0` means unlimited. `> 0` means limited — stored on the cart item as `maxQty`.
- `updateQty` blocks increment when `item.qty >= item.maxQty`.

### Category pages (`lib/categoryConfig.ts`)

`CATEGORY_CONFIGS` maps slugs → display config. Valid slugs: `vegetables`, `sauce`, `meat`, `seafood`, `grain`. Each maps to a `category` string on `Product`. Extend this file to add new category pages.

All valid `category` strings (35 total, also defined as `CATEGORIES` constant in admin and product pages):
`야채/채소` `과일` `쌀/잡곡` `축산/계란` `수산/건어물` `유제품/냉장/냉동` `견과` `고추장/된장/간장류` `양념/소스/육수` `식용유/조미료` `밀가루/라면/면` `캔/통조림` `김/편의식/반찬` `생수/음료` `커피믹스/티백` `빵/스낵/안주류` `헬스/건강식품` `반려동물용품` `소모품/일회용품` `조리도구` `식기/밀폐용기` `주방잡화` `욕실잡화` `생활잡화` `캠핑용품` `사무/자동차용품` `대용량 농산물` `대용량 축산물` `대용량 수산물` `대용량 장류/양념` `대용량 냉장/냉동` `대용량 가공식품` `대용량 커피/음료` `대용량 소모품/세제` `대용량 식기/도구`

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
| `/product/[id]` | Product detail; shows "관리자 편집" button when `pilmart_admin_active` is set |
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
- When adding a new `KEYS` entry, add it to `lib/storage.ts` and update both this file and the admin "계정/데이터" tab's reset list if appropriate.
