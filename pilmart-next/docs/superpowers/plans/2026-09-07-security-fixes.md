# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 critical security vulnerabilities in pilmart-next (pure-frontend Next.js e-commerce app).

**Architecture:** No backend — all data in localStorage. Fixes must work client-side only: SHA-256 via Web Crypto API for password hashing, Naver user-info API call to verify OAuth tokens, always trust `pending.total` (localStorage) over URL params for order amounts.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · localStorage

**Spec:** `/docs/superpowers/plans/2026-09-07-security-fixes.md` (this file)

## Global Constraints

- No backend — all fixes must be pure client-side
- Do NOT change the `Session`, `Order`, or `CartItem` types in `types/index.ts` (other code depends on them)
- Use `crypto.subtle.digest` (Web Crypto API) for SHA-256 — no npm dependencies
- Keep all UI text in Korean
- `pnpm build` must pass after all tasks

---

### Task 1: Password hashing utility + StoredUser type + storage key

**Files:**
- Create: `pilmart-next/lib/crypto.ts`
- Modify: `pilmart-next/types/index.ts`
- Modify: `pilmart-next/lib/storage.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>` — SHA-256 hex digest
- Produces: `StoredUser { phone: string; name: string; passwordHash: string }` type
- Produces: `KEYS.users = 'pilmart_users'`

- [x] **Step 1: Create `lib/crypto.ts`**

```typescript
export async function hashPassword(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

- [x] **Step 2: Add `StoredUser` to `types/index.ts`**

```typescript
export interface StoredUser {
  phone: string;
  name: string;
  passwordHash: string;
}
```

- [x] **Step 3: Add `users` key to `lib/storage.ts`**

```typescript
export const KEYS = {
  ...existingKeys,
  users: 'pilmart_users',
} as const;
```

- [x] **Step 4: Verify `pnpm tsc --noEmit` passes**

---

### Task 2: Fix auth — verify password on login, store hash on signup

**Files:**
- Modify: `pilmart-next/app/auth/page.tsx`

**Interfaces:**
- Consumes: `hashPassword` from `@/lib/crypto`, `StoredUser` from `@/types`, `KEYS.users`

**The problem:** `handleLogin` calls `login()` regardless of password. `handleSignup` never stores user credentials.

- [x] **Step 1: Update imports**

Add to existing imports:
```typescript
import { hashPassword } from '@/lib/crypto';
import { StoredUser } from '@/types';
import { KEYS, lsGet, lsSet } from '@/lib/storage';
```

- [x] **Step 2: Replace `handleLogin` — make async, verify password**

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!loginForm.phone || !loginForm.password) {
    toast.error('전화번호와 비밀번호를 입력해주세요.');
    return;
  }
  const users = lsGet<StoredUser[]>(KEYS.users, []);
  const stored = users.find(u => u.phone === loginForm.phone);
  if (!stored) {
    toast.error('전화번호 또는 비밀번호가 올바르지 않습니다.');
    return;
  }
  const hash = await hashPassword(loginForm.password);
  if (hash !== stored.passwordHash) {
    toast.error('전화번호 또는 비밀번호가 올바르지 않습니다.');
    return;
  }
  login({ name: stored.name, phone: stored.phone, loginAt: Date.now(), provider: 'local' });
  toast.success('로그인되었습니다.');
  router.push(redirect);
};
```

- [x] **Step 3: Replace `handleSignup` — make async, check duplicate, store hash**

```typescript
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!signupForm.name || !signupForm.phone || !signupForm.password) {
    toast.error('모든 항목을 입력해주세요.');
    return;
  }
  if (signupForm.password !== signupForm.confirm) {
    toast.error('비밀번호가 일치하지 않습니다.');
    return;
  }
  const users = lsGet<StoredUser[]>(KEYS.users, []);
  if (users.find(u => u.phone === signupForm.phone)) {
    toast.error('이미 등록된 전화번호입니다.');
    return;
  }
  const passwordHash = await hashPassword(signupForm.password);
  lsSet(KEYS.users, [...users, { phone: signupForm.phone, name: signupForm.name, passwordHash }]);
  login({ name: signupForm.name, phone: signupForm.phone, loginAt: Date.now(), provider: 'local' });
  toast.success('회원가입이 완료되었습니다.');
  router.push(redirect);
};
```

- [x] **Step 4: Run `pnpm build`**

---

### Task 3: Fix success page — use pending.total, not URL ?amount=

**Files:**
- Modify: `pilmart-next/app/success/page.tsx`

**The problem:** `total: Number(params.get('amount') ?? pending.total)` — attacker navigates to `/success?amount=1` while a pending order exists.

- [x] **Step 1: Change the `order` object construction**

```typescript
// Before:
total: Number(params.get('amount') ?? pending.total),
// After:
total: pending.total,
```

Display line (`const amount = params.get('amount')`) is fine to keep for showing Toss-confirmed amount to user — it is display-only and not stored.

- [x] **Step 2: Run `pnpm build`**

---

### Task 4: Fix naver-callback — verify token via Naver user-info API

**Files:**
- Modify: `pilmart-next/app/naver-callback/page.tsx`

**The problem:** Any `#access_token=anything` logs the user in without verification.

**Fix:** Call `https://openapi.naver.com/v1/nid/me` with the token. Only log in if `resultcode === '00'`. Show error toast and redirect to `/auth` on failure or CORS error.

- [x] **Step 1: Rewrite `NaverCallback` component**

```typescript
function NaverCallback() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const access_token = new URLSearchParams(hash.replace('#', '?')).get('access_token');

    if (!access_token) {
      router.replace('/auth');
      return;
    }

    fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(res => res.json())
      .then((data: { resultcode: string; response?: { name?: string; mobile?: string } }) => {
        if (data.resultcode === '00' && data.response) {
          login({
            name: data.response.name ?? '네이버 사용자',
            phone: data.response.mobile?.replace(/-/g, '') ?? '',
            loginAt: Date.now(),
            provider: 'naver',
          });
          router.replace('/');
        } else {
          toast.error('네이버 로그인에 실패했습니다.');
          router.replace('/auth');
        }
      })
      .catch(() => {
        toast.error('네이버 로그인을 처리할 수 없습니다.');
        router.replace('/auth');
      });
  }, [login, router]);

  return <p className="text-center py-16">로그인 처리 중...</p>;
}
```

Add `import { toast } from 'sonner'` to imports.

- [x] **Step 2: Run `pnpm build`**

---

### Task 5: Fix admin password — SHA-256 hash on store and compare

**Files:**
- Modify: `pilmart-next/app/admin/page.tsx`

**The problem:** Password stored and compared as plaintext. Default is `'1234'`.

**Migration strategy:** If the value in localStorage is a 64-char hex string it's already a hash; otherwise it's legacy plaintext — compare directly then upgrade to hash on success.

- [x] **Step 1: Add import**

```typescript
import { hashPassword } from '@/lib/crypto';
```

- [x] **Step 2: Replace `login()` function with async version**

```typescript
async function login() {
  const rawStored = typeof window !== 'undefined' ? localStorage.getItem(KEYS.adminPw) : null;
  const stored = rawStored ?? '1234';
  const isHash = /^[0-9a-f]{64}$/.test(stored);

  let matches: boolean;
  if (isHash) {
    const entered = await hashPassword(pw);
    matches = entered === stored;
  } else {
    matches = pw === stored;
    if (matches) {
      lsSet(KEYS.adminPw, await hashPassword(pw));
    }
  }

  if (matches) { setAuthed(true); setPwError(false); }
  else setPwError(true);
}
```

- [x] **Step 3: Replace `changeAdminPw()` with async version**

```typescript
async function changeAdminPw() {
  if (newPw.length < 4) return alert('4자 이상 입력해주세요');
  if (newPw !== newPwConfirm) return alert('비밀번호가 일치하지 않습니다');
  lsSet(KEYS.adminPw, await hashPassword(newPw));
  setNewPw(''); setNewPwConfirm('');
  alert('비밀번호가 변경되었습니다');
}
```

- [x] **Step 4: Run `pnpm build`**
