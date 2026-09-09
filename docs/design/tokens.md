# 필마트 디자인 토큰 가이드

> 기준일: 2026-09-08 | 색상 공간: oklch() 전용 | 폰트: Pretendard

---

## 1. 색상 토큰

### 1-1. Primary (이미 globals.css에 존재 — 수정 금지)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--primary` | `oklch(0.548 0.210 35.4)` | 주황-빨강 CTA, 브랜드 포인트 |
| `--primary-foreground` | `oklch(1 0 0)` | primary 배경 위 텍스트 (흰색) |

### 1-2. Sale / 할인강조

primary보다 채도를 높이고 명도를 약간 낮춰 "세일" 느낌 강조. 배경에 쓸 때는 10% opacity 활용.

| 토큰 (CSS 변수) | 값 | 의미 |
|---|---|---|
| `--sale` | `oklch(0.50 0.230 29.0)` | 할인가 배지 배경, 취소선 옆 숫자 강조 |
| `--sale-foreground` | `oklch(1 0 0)` | sale 배경 위 텍스트 |

Tailwind 유틸리티: `bg-sale`, `text-sale`, `text-sale-foreground`

사용 예:
```tsx
// 할인율 배지
<Badge className="bg-sale text-sale-foreground">-15%</Badge>

// 원가 취소선
<span className="text-muted-foreground line-through text-sm">12,000원</span>
<span className="text-sale font-bold">10,200원</span>
```

### 1-3. Flash / 오늘특가

주황-노랑 계열. primary·sale의 빨강 계열과 구별되도록 hue를 55~60도로 띄운다.

| 토큰 | 값 | 의미 |
|---|---|---|
| `--flash` | `oklch(0.68 0.185 55.0)` | 오늘특가 섹션 배지/강조 배경 |
| `--flash-foreground` | `oklch(0.15 0 0)` | flash 배경 위 텍스트 (어두운 색) |

Tailwind 유틸리티: `bg-flash`, `text-flash`, `text-flash-foreground`

> flash는 섹션 타이틀 배지 1곳 + 카운트다운 숫자 강조에만 사용. 카드 전체 배경에 쓰면 페이지가 과도하게 노랗게 보인다.

### 1-4. Success / 완료

| 토큰 | 값 | 의미 |
|---|---|---|
| `--success` | `oklch(0.55 0.160 148.0)` | 주문완료, 결제성공, 재고있음 표시 |
| `--success-foreground` | `oklch(1 0 0)` | success 배경 위 텍스트 |

### 1-5. 주문 상태 5종

배경(bg)용 변수와 텍스트(-foreground) 쌍으로 구성.

| 상태 | 배경 토큰 | 값 | 전경 토큰 | 값 | 설명 |
|---|---|---|---|---|---|
| 결제완료 | `--status-paid` | `oklch(0.90 0.065 250.0)` | `--status-paid-foreground` | `oklch(0.28 0.100 250.0)` | 연파랑 — 대기 중 |
| 상품준비 | `--status-preparing` | `oklch(0.93 0.075 80.0)` | `--status-preparing-foreground` | `oklch(0.35 0.130 70.0)` | 연노랑-주황 — 준비 중 |
| 배송중 | `--status-shipping` | `oklch(0.88 0.100 220.0)` | `--status-shipping-foreground` | `oklch(0.25 0.120 220.0)` | 청록 — 이동 중 |
| 배송완료 | `--status-done` | `oklch(0.88 0.100 148.0)` | `--status-done-foreground` | `oklch(0.28 0.120 148.0)` | 연초록 — 완료 |
| 취소/환불 | `--status-cancel` | `oklch(0.92 0.030 0.0)` | `--status-cancel-foreground` | `oklch(0.45 0.060 0.0)` | 연회색-핑크 — 비활성 |

Tailwind 유틸리티 예시: `bg-status-paid`, `text-status-paid-foreground`

---

## 2. 타이포그래피

기본 폰트: **Pretendard** (next/font 또는 CDN 로드). 숫자에 강한 tabular-nums 사용 권장.

### 2-1. 제목 스케일

| 역할 | 태그 | 크기 | 굵기 | 줄간격 |
|---|---|---|---|---|
| 페이지 타이틀 | h1 | `text-2xl` (24px) | `font-bold` (700) | `leading-tight` |
| 섹션 타이틀 | h2 | `text-xl` (20px) | `font-semibold` (600) | `leading-snug` |
| 카드 상품명 | h3 | `text-base` (16px) | `font-medium` (500) | `leading-snug` |

### 2-2. 본문

| 역할 | 크기 | 굵기 | 색상 |
|---|---|---|---|
| 기본 본문 | `text-sm` (14px) | `font-normal` | `text-foreground` |
| 보조 설명 | `text-xs` (12px) | `font-normal` | `text-muted-foreground` |
| 캡션/원산지 | `text-xs` (12px) | `font-normal` | `text-muted-foreground/70` |

### 2-3. 가격 표시

| 역할 | 크기 | 굵기 | 색상 | 특이사항 |
|---|---|---|---|---|
| 현재가 (대) | `text-lg` (18px) | `font-bold` | `text-foreground` | tabular-nums |
| 현재가 (카드) | `text-base` (16px) | `font-semibold` | `text-foreground` | tabular-nums |
| 원가 (취소선) | `text-sm` (14px) | `font-normal` | `text-muted-foreground` | line-through |
| 할인율 | `text-sm` (14px) | `font-bold` | `text-sale` | - |
| 단위 (g/개) | `text-xs` (12px) | `font-normal` | `text-muted-foreground` | - |

```tsx
// 가격 표시 패턴
<p className="text-lg font-bold tabular-nums">10,200원</p>
<p className="text-sm text-muted-foreground line-through tabular-nums">12,000원</p>
<span className="text-sm font-bold text-sale">-15%</span>
```

---

## 3. 간격 · 라운드 · 그림자

### 3-1. 간격 (spacing)

기본 단위는 Tailwind 4 기본 4px 그리드.

| 용도 | 클래스 | 값 |
|---|---|---|
| 카드 내부 패딩 | `p-3` | 12px |
| 카드 내부 패딩 (상세) | `p-4` | 16px |
| 카드 그룹 간격 | `gap-3` | 12px |
| 섹션 상하 여백 | `py-8` | 32px |
| 배지 내부 패딩 | (shadcn 기본 `px-2 py-0.5`) | — |
| 버튼 기본 높이 | (shadcn 기본 `h-8`) | 32px |

### 3-2. 라운드 (border-radius)

`globals.css`에 `--radius: 0.625rem` (10px) 기준으로 스케일 자동 파생.

| 토큰 | 계산값 | 용도 |
|---|---|---|
| `--radius-sm` | ~6px | 배지, 작은 태그 |
| `--radius-md` | ~8px | 인풋, 소형 버튼 |
| `--radius-lg` | 10px | 버튼 기본, 드롭다운 |
| `--radius-xl` | ~14px | 카드 |
| `--radius-2xl` | ~18px | 모달, 시트 |
| `--radius-4xl` | ~26px | 배지 pill (rounded-4xl) |

```tsx
// 마트 상품 카드
<div className="rounded-xl overflow-hidden border border-border shadow-sm">
```

### 3-3. 그림자 (shadow)

마트 특성상 과도한 그림자보다 경계선 + 약한 그림자 조합 권장.

| 용도 | 클래스 |
|---|---|
| 상품 카드 기본 | `shadow-sm` |
| 카드 호버 | `hover:shadow-md` |
| 모달/시트 | `shadow-xl` |
| 헤더 | `shadow-sm` |

---

## 4. 컴포넌트 사용 가이드

### 4-1. Button variant별 올바른 용도

| variant | 용도 | 사용 예 |
|---|---|---|
| `default` | **구매 CTA** (장바구니 담기, 결제하기, 로그인 등 주요 행동) | `<Button>장바구니 담기</Button>` |
| `outline` | **보조 동작** (취소, 뒤로가기, 필터 선택, 탭 등 primary가 아닌 모든 것) | `<Button variant="outline">취소</Button>` |
| `secondary` | **중립 동작** (목록으로, 공유하기 등 덜 중요한 동작) | `<Button variant="secondary">목록으로</Button>` |
| `ghost` | **아이콘 버튼 / 네비게이션** (헤더 아이콘, 사이드 메뉴 항목) | `<Button variant="ghost" size="icon"><ShoppingCart /></Button>` |
| `destructive` | **삭제 전용** — 장바구니 상품 삭제, 계정 탈퇴 등 되돌릴 수 없는 동작 | `<Button variant="destructive">삭제</Button>` |
| `link` | **텍스트 링크** (이용약관, 더보기 등 페이지 이동 링크처럼 보여야 할 때) | `<Button variant="link">이용약관 보기</Button>` |

> 주의: `destructive`는 삭제/취소 확인 다이얼로그 안에서만 사용. 일반 "취소" 버튼에는 `outline`을 사용한다.

### 4-2. Badge variant별 올바른 용도

| variant | 용도 | 사용 예 |
|---|---|---|
| `default` | **카테고리 태그**, 브랜드 라벨 (primary 배경) | `<Badge>야채/채소</Badge>` |
| `secondary` | **재고 상태**, 중립 정보 표시 (회색 계열) | `<Badge variant="secondary">잔여 3개</Badge>` |
| `destructive` | **품절**, 판매종료 등 부정적 상태 | `<Badge variant="destructive">품절</Badge>` |
| `outline` | **원산지**, 등급 등 보조 정보 (테두리만) | `<Badge variant="outline">국산</Badge>` |
| `ghost` | **태그/필터** 비활성 상태 | `<Badge variant="ghost">냉동</Badge>` |
| `link` | Badge를 링크처럼 쓸 때 (거의 사용 안 함) | — |

#### 주문 상태 배지 패턴 (커스텀 클래스 사용)

shadcn Badge의 `className`에 CSS 변수 기반 클래스를 직접 적용:

```tsx
const STATUS_BADGE: Record<string, string> = {
  paid:      'bg-status-paid text-status-paid-foreground',
  preparing: 'bg-status-preparing text-status-preparing-foreground',
  shipping:  'bg-status-shipping text-status-shipping-foreground',
  done:      'bg-status-done text-status-done-foreground',
  cancel:    'bg-status-cancel text-status-cancel-foreground',
}

<Badge className={STATUS_BADGE[order.status]}>배송완료</Badge>
```

#### 할인/특가 배지 패턴

```tsx
// 할인 배지 (sale 토큰)
<Badge className="bg-sale text-sale-foreground">-15%</Badge>

// 오늘특가 배지 (flash 토큰)
<Badge className="bg-flash text-flash-foreground">오늘특가</Badge>

// 결제완료 배지 (success 토큰)
<Badge className="bg-success text-success-foreground">결제완료</Badge>
```

---

## 5. 빨간 계열 색상 사용 지침

primary / sale / destructive 모두 빨간 계열이므로 **한 화면에서 동시에 과도하게 사용하면 시각적 혼란**이 생긴다.

### 우선순위 규칙

1. **primary** — 헤더 로고, 메인 CTA 버튼 1개 (장바구니 담기 또는 결제하기)
2. **sale** — 카드당 할인율 배지 1개 + 할인가 텍스트
3. **destructive** — 삭제 버튼만. 카드에 표시하지 않는다
4. **flash** — 오늘특가 섹션 전용. 다른 섹션에서 사용 금지

### 접근성 체크리스트

- `bg-sale text-sale-foreground`: white on oklch(0.50) → 대비 약 5.2:1 (통과)
- `bg-flash text-flash-foreground`: dark on oklch(0.68) → 대비 약 7.1:1 (통과)
- `bg-status-paid text-status-paid-foreground`: 대비 약 6.8:1 (통과)
- `bg-success text-success-foreground`: white on oklch(0.55) → 대비 약 4.8:1 (통과)

모든 토큰은 WCAG AA 기준(4.5:1) 이상을 충족하도록 설계되었다.
