# SDD ledger — plan: docs/superpowers/plans/2026-09-07-pilmart-nextjs-shadcn.md

MERGE_BASE: c3ff09a82e1a196568e93af19c4f34a0faaa2078
Branch: feature/pilmart-nextjs-shadcn

---

## Pre-flight Interface Scan

| Tasks | T produces | T' consumes | Finding |
|-------|-----------|-------------|---------|
| T2→T3 | `lsGet<T>(key,fallback):T`, `lsSet`, `lsRemove`, `KEYS.*` | Same names imported in StoreProvider | Clean |
| T2→T3 | `types/index.ts`: `Product, CartItem, Order, Session, Notice, FlashProduct, FlashSaleConfig, StoreInfo, ProductOverride` | All used in StoreProvider and hooks | Clean |
| T3→T4 | `StoreProvider`, `useCart`, `useWishlist`, `useAuth` exported | Imported in layout.tsx and components | Clean |
| T3→T5 | `useCart().addItem(product: Product)` | ProductCard calls `addItem(product)` | Clean |
| T3→T8 | `useCart().items, total, clearCart`, `useTossPayment()` | Used in checkout/page.tsx | Clean |
| T3→T9 | `useCart().clearCart()` | Called in success/page.tsx effect | Clean |
| T2→T4 | `getProductImage(id: string): string` from lib/products | CartSheet uses it for item images | Clean |
| T2→T5 | `getProducts(): Product[]`, `getProductImage` | Used in ProductCard, ProductGrid, page.tsx | Clean |
| T2→T6 | `getProducts()`, `KEYS.*`, `lsGet` | Used in product/[id] and flash-product/[idx] | Clean |
| T2→T11 | `PRODUCTS` (named export), all types | admin/page.tsx uses PRODUCTS array directly | Clean |
| T1→T2 | `lib/utils.ts` exists with `cn()` (created by shadcn init) | T2 adds `formatPrice` below existing content | Clean |

**Self-consistency per task:**
- T1: Standalone scaffold. No dependencies. Clean.
- T2: Adds `formatPrice` to shadcn-generated `lib/utils.ts`. Plan says "기존 내용 아래에 추가". Correct.
- T3: `hooks/useCart.ts` re-exports `useCart` from `context/StoreProvider`. Simple re-export pattern. Clean.
- T4: `CartSheet` emoji fallback uses a data URI — acceptable implementation detail.
- T6: Flash-product addItem passes `category: '야채/채소'` hardcoded — satisfies Product type union. Clean.
- T7: `useSearchParams()` wrapped in `<Suspense>` — required by Next.js 15. Correct.
- T9: `success/page.tsx` calls `clearCart()` inside `useEffect` — provider wraps layout, so context available. Clean.

**Scan verdict: CLEAN — all interfaces consistent across tasks.**

---

## Task Progress

Task 1: complete (commits c3ff09a..4723920, review clean)
Task 2: complete (commits 4723920..18951d4, review clean)
Task 3: complete (commits 18951d4..cb2c38d, review clean; minor deferred: unused persist fn)
Tasks 4-12: complete (commits cb2c38d..616b891, fix round 1/5 — Critical+Important addressed)
Final review: Ready to merge (commits c3ff09a..616b891)
  Deferred minors (safe to defer):
  - Unused persist fn in CartProvider
  - success/page.tsx stale useEffect deps
  - checkout/page.tsx orderId outside useMemo
  - Suspense missing fallback prop
  Ruling: <img> for logo accepted (dispatch instructed this to avoid next/image domain config)
  Ruling: @base-ui/react API adaptations accepted (ToggleGroup array value, Accordion props, SheetTrigger render prop)
  Ruling: Next.js 16.3.4 (not 15) accepted — latest stable, intent preserved
  Ruling: oklch color format accepted — Tailwind v4 standard, visually identical

