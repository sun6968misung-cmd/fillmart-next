# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this directory is

The Antigravity IDE application data directory. It contains two active projects:

| Project | Path | Stack |
|---|---|---|
| **필마트** (Korean grocery e-commerce) | `pilmart/` | HTML + Tailwind CDN + Alpine.js v3 + localStorage |
| **vscode-python-environments** VS Code extension | `extensions\ms-python.vscode-python-envs-1.20.1-universal\` | TypeScript, Node.js, VS Code Extension API, Webpack, Mocha/Sinon |

The user's **CCTV person-detection project** is at `C:\Users\USER\Desktop\cctv_watch\` (Python) — separate CLAUDE.md there.

---

## 필마트 (`pilmart/`)

Pure-frontend site — no build step, no backend. Open HTML files directly in a browser, or serve with:

```powershell
python -m http.server 8080 --directory pilmart
# then open http://localhost:8080
```

A local server is required for Toss Payments online card/transfer flows (the SDK needs a real `window.location.origin` for `successUrl`/`failUrl`). "만나서" payment methods work without a server.

### Architecture

**Shared JS (loaded on every page before Alpine):**
- `js/store.js` — Alpine stores: `cart`, `wishlist`, `auth`; plus `requestTossPayment()` wrapper and global `fmt()`. Must be loaded via `<script src="js/store.js">` **before** the Alpine `defer` tag.
- `js/products.js` — `PRODUCTS` array (26 items), `PRODUCT_IMAGES` object, `applyProductOverrides()`, `getProductImage()`. Pages that render products must load this file.

**`admin.html` has a local `BASE_PRODUCTS` array** that duplicates `js/products.js`. When adding or changing products, update **both** files. Admin saves price/name/image overrides to the `pilmart_products` localStorage key; `applyProductOverrides()` merges these onto the shared `PRODUCTS` array at runtime.

**Payment flow:**
- Online card / transfer → `requestTossPayment()` in `js/store.js` → Toss SDK → redirects to `success.html?paymentKey=…&orderId=…&amount=…`
- 만나서카드 / 만나서현금 → `success.html?method=meet-card|meet-cash&orderId=…&amount=…` (bypasses Toss)
- `checkout.html` writes `pilmart_pending_order` to localStorage before triggering payment. `success.html` reads it to record items in `pilmart_orders`, then calls `clearCart()`.

**Flash sale:** stored in `pilmart_flash_sale` as `{ startHour, endHour, products[] }`. `flash-product.html?idx=N` is the per-product detail page. Per-customer limit (`maxPerCustomer`) is enforced by comparing `Alpine.store('cart').items.find(x => x.id === 'flash' + idx)?.qty` — not total inventory.

**Category filter (index.html):** `filterByCategory(cat)` hides the four main `<section>` elements and renders a filtered grid from the shared `PRODUCTS` array. Categories that have no products show a "준비 중" message. `clearCategoryFilter()` restores the main sections.

### localStorage keys

| Key | Contents |
|---|---|
| `pilmart_cart` | Cart items array |
| `pilmart_wishlist` | Wishlist product IDs |
| `pilmart_session` | Auth session (30-day TTL) |
| `pilmart_orders` | Completed orders (last 30) |
| `pilmart_pending_order` | Snapshot written before payment, cleared in success.html |
| `pilmart_products` | Admin price/name/image overrides (merged onto PRODUCTS) |
| `pilmart_notices` | Notice board items |
| `pilmart_flash_sale` | Flash sale config and products |
| `pilmart_store_info` | Store name, phone, address, etc. |
| `pilmart_admin_pw` | Admin password (default: 1234) |

### Toss Payments key

`TOSS_CLIENT_KEY` is the first line of `js/store.js`. Currently set to the **test** key (`test_ck_…`). To go live, swap to the live key (`live_ck_…`) from the Toss Payments dashboard.

### Category values in use

`야채/채소`, `과일`, `축산/계란`, `수산/건어물`, `라면/면류`, `유제품/냉장/냉동`, `캔/통조림`. All products in `js/products.js` and `admin.html`'s `BASE_PRODUCTS` must use these exact strings for category filtering to work.

---

## vscode-python-environments extension

Run from `extensions\ms-python.vscode-python-envs-1.20.1-universal\`:

```powershell
npm run lint              # ESLint
npm run compile-tests     # TypeScript type-check only
npm run unittest          # Mocha unit tests
npm run compile           # Webpack build (required before smoke/E2E)
npm run smoke-test        # Smoke tests (needs webpack build first)
npm run vsce-package      # Package as .vsix
```

### Architecture

- `src/managers/` — One sub-folder per environment manager (venv, conda, poetry, pipenv, pyenv, pixi, uv)
- `src/features/` — Terminal activation, settings, views, package execution
- `src/common/` — Shared utilities and public API surface

### High-risk areas

| Area | Issue |
|---|---|
| `src/managers/common/nativePythonFinder.ts` | Type guards, cache, resource leaks |
| `src/features/terminal/` | Timing, shell detection, reveal logic |
| `src/managers/poetry/` | `{cache-dir}` placeholder, env vars |
| `src/managers/pyenv/` | Windows path calculation |
| `src/features/settings/` | `inspect()` vs `get()` precedence |

### Coding rules

- **User-facing strings:** `l10n.t()` — never raw literals
- **Logging:** `traceLog`/`traceVerbose` only; never `console.log`
- **Paths:** always `path.join()` or `Uri.file(p).fsPath`; never `/`-concatenation
- **Settings:** use `getConfiguration(section, scope).inspect()` with a scope — bare `inspect()` returns `undefined` for `workspaceFolderValue`
- **Path comparison:** `path.resolve()` on both sides or `normalizePath()` from `pathUtils.ts`; `path.normalize()` does not add the drive letter on Windows
- **API shape:** flat — `api.getEnvironments()`, not `api.environments.getEnvironments()`
- **Environment id:** `env.envId` (a `PythonEnvironmentId`), not `env.id`

### Workflow

Branch naming: `feature/issue-N`, `bug/issue-N`, `chore/issue-N`. Commit format: `feat|fix|chore|docs|refactor|test: description (Fixes #N)`. Before every commit: lint + compile-tests + unittest. CI smoke tests need `npm run compile` (webpack), not just `compile-tests` (tsc).
