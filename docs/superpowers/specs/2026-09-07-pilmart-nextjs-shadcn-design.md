# 필마트 Next.js + shadcn/ui 마이그레이션 설계

**날짜:** 2026-09-07  
**범위:** 필마트 전체 — HTML/Alpine.js → Next.js 15 + shadcn/ui 완전 재구현  
**목표:** UX/UI 전면 재설계 + 현대적 컴포넌트 시스템 도입, 기존 기능 100% 유지

---

## 1. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | 파일 기반 라우팅, 정적 내보내기 가능 |
| UI 라이브러리 | shadcn/ui | Radix UI 기반, Tailwind 통합 |
| 스타일링 | Tailwind CSS v4 | shadcn init으로 자동 설정 |
| 언어 | TypeScript | strict 모드 |
| 결제 | Toss Payments SDK | 기존 test_ck_ 키 유지 |
| 알림 | Sonner (shadcn toast) | alert() 대체 |
| 패키지 매니저 | pnpm | 속도, 디스크 효율 |

백엔드 없음. 모든 상태는 localStorage에 저장 (기존 키 구조 완전 유지).

---

## 2. 디렉터리 구조

```
pilmart-next/                      ← 신규 폴더 (pilmart/ 병행 유지)
├── app/
│   ├── layout.tsx                 ← 공통 레이아웃 (Navbar, Footer, Providers)
│   ├── page.tsx                   ← 메인 (index.html)
│   ├── auth/page.tsx              ← 로그인/회원가입
│   ├── product/[id]/page.tsx      ← 상품 상세
│   ├── flash-product/[idx]/page.tsx ← 플래시 세일 상품
│   ├── checkout/page.tsx          ← 결제
│   ├── orders/page.tsx            ← 주문 내역
│   ├── wishlist/page.tsx          ← 찜 목록
│   ├── success/page.tsx           ← 결제 완료
│   ├── fail/page.tsx              ← 결제 실패
│   ├── admin/page.tsx             ← 관리자
│   ├── notice/page.tsx            ← 공지사항
│   ├── faq/page.tsx               ← 자주 묻는 질문
│   ├── contact/page.tsx           ← 고객문의
│   ├── terms/page.tsx             ← 이용약관
│   ├── privacy/page.tsx           ← 개인정보처리방침
│   └── naver-callback/page.tsx    ← 네이버 로그인 콜백
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx             ← 상단 내비게이션
│   │   ├── Footer.tsx             ← 하단 푸터
│   │   └── CartSheet.tsx          ← 장바구니 슬라이드 드로어
│   ├── product/
│   │   ├── ProductCard.tsx        ← 상품 카드
│   │   ├── ProductGrid.tsx        ← 상품 그리드
│   │   └── CategoryFilter.tsx     ← 카테고리 필터
│   ├── home/
│   │   ├── HeroBanner.tsx         ← 메인 배너
│   │   └── FlashSaleSection.tsx   ← 플래시 세일 섹션
│   └── ui/                        ← shadcn/ui 자동 생성 컴포넌트
├── lib/
│   ├── products.ts                ← PRODUCTS 배열 (JS → TS 변환)
│   ├── storage.ts                 ← localStorage 읽기/쓰기 유틸
│   └── utils.ts                   ← cn(), formatPrice() 등
├── hooks/
│   ├── useCart.ts
│   ├── useWishlist.ts
│   ├── useAuth.ts
│   └── useTossPayment.ts
├── context/
│   └── StoreProvider.tsx          ← cart, wishlist, auth Context 통합
├── types/
│   └── index.ts                   ← Product, CartItem, Order 등 타입 정의
└── public/
    └── logo.png                   ← 기존 로고 복사
```

---

## 3. 상태 관리

Alpine 스토어 3개를 React Context + custom hook 패턴으로 교체.  
localStorage 키는 변경하지 않아 기존 사용자 데이터가 그대로 유지된다.

### localStorage 키 (변경 없음)

| 키 | 내용 |
|---|---|
| `pilmart_cart` | 장바구니 아이템 배열 |
| `pilmart_wishlist` | 찜 목록 상품 ID 배열 |
| `pilmart_session` | 인증 세션 (30일 TTL) |
| `pilmart_orders` | 완료된 주문 (최근 30건) |
| `pilmart_pending_order` | 결제 전 임시 저장 주문 |
| `pilmart_products` | 관리자 가격/이름/이미지 오버라이드 |
| `pilmart_notices` | 공지사항 |
| `pilmart_flash_sale` | 플래시 세일 설정 |
| `pilmart_store_info` | 매장 정보 |
| `pilmart_admin_pw` | 관리자 비밀번호 |

### Context 구조

```ts
// context/StoreProvider.tsx
<AuthProvider>
  <CartProvider>
    <WishlistProvider>
      {children}
    </WishlistProvider>
  </CartProvider>
</AuthProvider>
```

각 Provider는 초기 마운트 시 localStorage에서 상태를 읽고, 변경 시 즉시 write.

---

## 4. UX/UI 재설계

### 색상 테마

shadcn CSS 변수 커스터마이징:

- **Primary:** 초록 계열 (`hsl(142 71% 45%)`) — 신선식품 쇼핑몰 정체성
- **Background:** 흰색/밝은 회색
- **Accent:** 연한 초록
- **Destructive:** 빨강 (기존 유지)

### 컴포넌트 매핑

| 영역 | 기존 방식 | shadcn/ui 대체 |
|---|---|---|
| 장바구니 | 별도 페이지 이동 | `Sheet` (우측 슬라이드 드로어) |
| 상품 카드 | 커스텀 div + Tailwind | `Card`, `CardContent`, `Badge` |
| 로그인 폼 | 커스텀 모달 | `Dialog` + `Input` + `Label` |
| 알림/토스트 | `alert()` | Sonner `toast()` |
| 버튼 전체 | Tailwind 클래스 직접 | `Button` (variant: default/outline/ghost) |
| 네비게이션 | 고정 상단 div | `NavigationMenu` + `Sheet` (모바일) |
| 카테고리 필터 | 버튼 토글 그룹 | `ToggleGroup` |
| 관리자 섹션 탭 | 커스텀 탭 UI | `Tabs`, `TabsContent` |
| 결제 폼 | 커스텀 select/input | `Select`, `RadioGroup`, `Input` |
| 주문 내역 | 커스텀 카드 | `Accordion` (주문별 접기/펼치기) |
| 검색 | 없음 | `Command` (상단 검색 팔레트) |
| 로딩 | 없음 | `Skeleton` |
| 상품 이미지 없음 | 빈 박스 | `Avatar` fallback |

### 주요 페이지 UX 개선

**메인 (/):**
- 히어로 배너 영역 추가 (카테고리 빠른 접근)
- 플래시 세일 카운트다운 타이머 유지
- 카테고리 필터 → `ToggleGroup` 으로 상단 고정
- 상품 그리드 → `Card` 컴포넌트, hover 시 shadcn 스타일 elevation

**장바구니:**
- 기존: 별도 페이지 (`cart.html` 없이 index 내 처리)
- 신규: `Sheet` 드로어로 어느 페이지에서든 우측에서 슬라이드
- 수량 조절 `+/-` 버튼 → shadcn `Button` size="icon"

**결제 (checkout):**
- 결제 수단 선택 → `RadioGroup` 카드 스타일
- 주소 입력 → `Input` + `Label` 그룹
- 최종 확인 → `Separator` 로 섹션 구분

**관리자 (admin):**
- 섹션별 `Tabs` 분리 (상품 관리 / 주문 / 공지 / 설정)
- 상품 추가/수정 → `Dialog` 내 폼
- 데이터 테이블 → shadcn `Table`

---

## 5. 결제 흐름 (기존 유지)

```
checkout/page.tsx
  → useTossPayment() hook
  → Toss SDK (window.TossPayments)
  → successUrl: /success?paymentKey=...
  → failUrl: /fail

만나서 결제:
  → /success?method=meet-card|meet-cash&orderId=...
```

`TOSS_CLIENT_KEY`는 환경변수 `NEXT_PUBLIC_TOSS_CLIENT_KEY`로 이동.  
`.env.local`에 `test_ck_...` 키 설정.

---

## 6. 마이그레이션 전략

- 신규 폴더 `pilmart-next/` 에서 개발 (기존 `pilmart/` 폴더 보존)
- 개발 서버: `pnpm dev` → `http://localhost:3000`
- `lib/products.ts`는 기존 `js/products.js`의 PRODUCTS 배열을 TypeScript로 변환
- `public/logo.png` ← `pilmart/logo.png` 복사
- 완성 후 사용자가 직접 `pilmart/`를 `pilmart-next/`로 교체 여부 결정

---

## 7. shadcn/ui 설치 컴포넌트 목록

초기 설치:
`button`, `card`, `badge`, `sheet`, `dialog`, `input`, `label`, `select`,
`tabs`, `toggle-group`, `radio-group`, `separator`, `skeleton`, `avatar`,
`accordion`, `command`, `table`, `navigation-menu`, `toast` (sonner)

필요 시 추가:
`dropdown-menu`, `popover`, `tooltip`, `scroll-area`, `progress`
