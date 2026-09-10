# 필마트 데이터 레이어 Supabase 전환 설계

작성일: 2026-09-10  
범위: 상품·관리자 계정·감사 로그 localStorage → Supabase 교체

---

## 현황

주문·공지·플래시 세일·매장 정보·회원은 이미 Supabase 연동 완료.  
아래 3가지만 남음:

| 데이터 | 현재 저장소 | 목표 |
|---|---|---|
| 상품 overrides + 커스텀 상품 | localStorage | Supabase `product_overrides`, `custom_products` |
| 관리자 계정 + 비밀번호 | localStorage | Supabase `admin_accounts` |
| 감사 로그 | localStorage | Supabase `audit_logs` |

---

## 요건

1. 신규 API 3개에 **서버 세션 기반 관리자 인증** (HttpOnly 쿠키 + 서명된 토큰)
2. `admin_accounts` 비밀번호는 **bcrypt** 해시 (현재 SHA-256 → 교체)
3. 감사 로그 actor는 **서버가 세션에서 기록**, DELETE 엔드포인트 없음
4. serverSync/store 삭제 전 **localStorage → Supabase 일회성 마이그레이션** 단계
5. 고객 화면 상품 overrides 반영 **이번 단계에 포함** (ServerSyncProvider 업데이트)

---

## 아키텍처

### 관리자 세션

기존 localStorage 플래그(`pilmart_admin_active`) + sessionStorage 방식을 **서버 세션 쿠키**로 교체.

- 로그인: `POST /api/admin/login` → 검증 성공 시 HttpOnly `admin_session` 쿠키 발급 (서명된 JSON, 24h 만료)
- 로그아웃: `POST /api/admin/logout` → 쿠키 삭제
- 인증 헬퍼: `lib/admin-session.ts` → 쿠키 파싱·검증, `AdminSession { username, role }` 반환

세션 서명 키: `ADMIN_SESSION_SECRET` 환경 변수 (신규 추가).  
서명 방법: `crypto.subtle` HMAC-SHA256 (Node.js 내장, 추가 패키지 없음).

### 비밀번호 해시

- 패키지: `bcryptjs` (pure JS, Edge Runtime 불가 → Node.js runtime 전용 라우트)
- cost factor: 12
- 기존 SHA-256 해시는 마이그레이션 시 bcrypt로 재해시

### 상품 API

```
GET  /api/products           — 공개용 (overrides 적용 상품 목록, 인증 불필요)
POST /api/products           — 커스텀 상품 추가 (admin 인증)
PATCH /api/products          — override 수정 (admin 인증)
DELETE /api/products         — 숨김/복원/커스텀 삭제 (admin 인증)
```

Supabase 테이블:
- `product_overrides`: `product_id TEXT PK, name TEXT, price INT, image_url TEXT, detail_image_url TEXT, original_price INT, tax_type TEXT, hidden BOOL, unit TEXT, description TEXT, origin TEXT, storage TEXT, expiry_date TEXT, product_info TEXT, customer_service_no TEXT`
- `custom_products`: 기존 스키마 유지 (이미 생성됨)

Base64 이미지: `image_url` 컬럼에 직접 저장 (기존 방식 유지, 용량 주의 문서화).

### 관리자 계정 API

```
GET    /api/admin/accounts   — 계정 목록 (super만)
POST   /api/admin/accounts   — 계정 추가 (super만, bcrypt 해시)
PATCH  /api/admin/accounts   — 활성/비활성 토글 (super만)
DELETE /api/admin/accounts   — 계정 삭제 (super만)
```

super admin은 `admin_accounts`에 `username = '__super__'` 레코드로 관리.  
초기 비밀번호: `1234` → bcrypt 해시로 DB 삽입 (마이그레이션 시).

### 감사 로그 API

```
GET  /api/admin/logs         — 목록 조회 (admin 인증, super만 전체 열람)
POST /api/admin/logs         — 로그 추가 (admin 인증, actor는 서버 세션에서 추출)
```

DELETE 없음. DB 레벨에서 최신 1000건 유지 (트리거로 오래된 것 자동 삭제).

---

## 구현 단계 (순서)

### Phase 0: 환경 준비
- `.env.local`에 `ADMIN_SESSION_SECRET` 추가 (32자 이상 임의 문자열)
- `pnpm add bcryptjs && pnpm add -D @types/bcryptjs`
- SQL: `product_overrides` 컬럼 확장 마이그레이션 실행

### Phase 1: 인증 레이어
- `lib/admin-session.ts` — sign/verify 헬퍼
- `app/api/admin/login/route.ts` — bcrypt 검증, 쿠키 발급
- `app/api/admin/logout/route.ts` — 쿠키 삭제
- `app/admin/page.tsx` 로그인 함수: localStorage 검증 → API 호출로 교체

### Phase 2: 상품 API
- `app/api/products/route.ts` (GET 공개 / POST·PATCH·DELETE 인증)
- SQL: `product_overrides` 컬럼 확장 + RLS 정책 (service_role 전용 write)

### Phase 3: 관리자 계정 API
- `app/api/admin/accounts/route.ts`

### Phase 4: 감사 로그 API
- `app/api/admin/logs/route.ts`
- SQL: audit_logs 자동 정리 트리거 (1000건 초과 시 삭제)

### Phase 5: Admin 페이지 교체
- 상품 편집·삭제·복원·Excel import: localStorage → API
- 관리자 계정 CRUD: localStorage → API
- `addLog()`: localStorage → `POST /api/admin/logs`
- 관리자 비밀번호 변경: localhost → API

### Phase 6: 일회성 마이그레이션
- Admin 페이지에 "Supabase 마이그레이션" 버튼 (super만 노출)
- 클릭 시: localStorage에서 products·custom_products·adminAccounts·adminPw 읽어 API에 일괄 전송
- 성공 후 해당 localStorage 키 삭제
- 이 버튼은 마이그레이션 완료 후 코드에서 제거

### Phase 7: 고객 화면 반영 (ServerSyncProvider 업데이트)
- `components/ServerSyncProvider.tsx`: `/api/store` products 키 → `/api/products` 호출로 교체
- localStorage `pilmart_products` + `pilmart_custom_products`는 캐시로 유지

### Phase 8: 정리
- `lib/serverSync.ts` 삭제
- `app/api/store/route.ts` 삭제
- `lib/storage.ts`: SHARED_KEYS·serverSet 로직 제거, LOCAL_ONLY 키만 유지
- `CLAUDE.md`의 SHARED_KEYS ↔ ALLOWED_KEYS 주의사항 업데이트

---

## 영향받는 파일 목록

**신규 생성 (7개)**
- `lib/admin-session.ts`
- `app/api/admin/login/route.ts`
- `app/api/admin/logout/route.ts`
- `app/api/products/route.ts`
- `app/api/admin/accounts/route.ts`
- `app/api/admin/logs/route.ts`
- `supabase/migrations/002_product_overrides_expand.sql`

**수정 (5개)**
- `app/admin/page.tsx` (가장 많은 변경)
- `components/ServerSyncProvider.tsx`
- `lib/storage.ts`
- `.env.local`
- `CLAUDE.md`

**삭제 (2개)**
- `lib/serverSync.ts`
- `app/api/store/route.ts`

---

## 제외 범위

- `lib/products.ts` 정적 배열 — 변경 없음
- Cart·Wishlist — localStorage 유지
- Admin 로그인 세션 active 플래그 — 쿠키 기반으로 교체되므로 `pilmart_admin_active` 키 제거
- Base64 로고 — localStorage 유지 (용량 문제로 Supabase 저장 불가)
- Supabase Realtime 구독 — 별도 단계 (Flutter 앱 개발 시)

---

## 보안 고려사항

- `ADMIN_SESSION_SECRET`은 절대 클라이언트 노출 금지 (NEXT_PUBLIC_ 접두사 사용 금지)
- bcrypt cost 12: 로그인 시 ~300ms 지연 (허용 범위)
- 감사 로그 actor 서버 추출: 클라이언트 위변조 불가
- service_role 키 사용 범위: 서버 사이드 API 라우트만
