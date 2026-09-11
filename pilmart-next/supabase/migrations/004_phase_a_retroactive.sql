-- Phase A 소급 마이그레이션
-- Supabase 대시보드에서 직접 적용한 orders 테이블 변경 사항을 파일로 기록.
-- 탐침 결과 기반으로 작성 (2026-09-11):
--   • 추가 컬럼: order_key, payment_key, pending_expires_at
--   • CHECK 제약명: orders_status_check
--   • UNIQUE 제약명: orders_order_key_unique
--   • status DEFAULT: null (기존 'pending' 제거됨)
--
-- IF NOT EXISTS / DROP CONSTRAINT IF EXISTS 패턴으로 작성.
-- 이미 적용된 환경과 신규 환경 모두에서 재실행해도 에러 없음.

-- ── 1. Phase A 추가 컬럼 ──────────────────────────────────────────────
alter table public.orders
  add column if not exists order_key          text,
  add column if not exists payment_key        text,
  add column if not exists pending_expires_at timestamptz;

-- ── 2. status 컬럼 기본값 제거 ────────────────────────────────────────
-- 기존: default 'pending' → 현재: null (코드가 항상 명시적으로 status를 지정함)
-- ALTER COLUMN DROP DEFAULT는 멱등이 아니므로 DO 블록으로 보호
do $$
begin
  if (
    select column_default
    from   information_schema.columns
    where  table_schema = 'public'
      and  table_name   = 'orders'
      and  column_name  = 'status'
  ) is not null then
    alter table public.orders alter column status drop default;
  end if;
end;
$$;

-- ── 3. status CHECK 제약: 영어 → 한국어 7개 값 ────────────────────────
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    '결제대기',
    '주문완료',
    '배송준비중',
    '배송중',
    '배송완료',
    '취소완료',
    '삭제됨'
  ));

-- ── 4. order_key UNIQUE 제약 ──────────────────────────────────────────
alter table public.orders
  drop constraint if exists orders_order_key_unique;

alter table public.orders
  add constraint orders_order_key_unique unique (order_key);
