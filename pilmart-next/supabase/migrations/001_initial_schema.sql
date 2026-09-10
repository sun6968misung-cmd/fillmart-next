-- ============================================================
-- 필마트 초기 스키마
-- Supabase SQL Editor에 전체 붙여넣기 후 실행
-- ============================================================

-- 1. 회원 프로필 (Supabase auth.users 확장)
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  phone       text unique,
  name        text,
  address     text,
  user_type   text default 'personal' check (user_type in ('personal', 'business')),
  business_no      text,
  business_name    text,
  business_type    text,
  business_category text,
  provider    text default 'local',
  created_at  timestamptz default now()
);

-- 2. 상품
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  price         integer not null,
  category      text,
  unit          text,
  tax_type      text default 'taxFree' check (tax_type in ('tax', 'taxFree')),
  image_url     text,
  description   text,
  is_hidden     boolean default false,
  is_flash      boolean default false,
  display_order integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3. 관리자 가격/이름 오버라이드
create table public.product_overrides (
  product_id uuid references public.products on delete cascade primary key,
  name       text,
  price      integer,
  image_url  text
);

-- 4. 커스텀 상품 (Excel 임포트)
create table public.custom_products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  price         integer not null,
  category      text,
  unit          text,
  tax_type      text default 'taxFree',
  image_url     text,
  description   text,
  is_hidden     boolean default false,
  display_order integer default 0,
  created_at    timestamptz default now()
);

-- 5. 플래시 세일
create table public.flash_sale (
  id         uuid primary key default gen_random_uuid(),
  start_hour integer check (start_hour between 0 and 23),
  end_hour   integer check (end_hour between 0 and 23),
  is_active  boolean default false,
  products   jsonb default '[]'::jsonb
);

-- 6. 주문
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles on delete set null,
  items            jsonb not null default '[]'::jsonb,
  total_amount     integer default 0,
  vat_amount       integer default 0,
  payment_method   text,
  delivery_address text,
  delivery_memo    text,
  customer_name    text,
  customer_phone   text,
  status           text default 'pending'
                     check (status in ('pending','confirmed','cancelled','delivering','delivered')),
  cancelled_items  jsonb default '[]'::jsonb,
  created_at       timestamptz default now()
);

-- 7. 공지사항
create table public.notices (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text,
  is_pinned  boolean default false,
  created_at timestamptz default now()
);

-- 8. 매장 정보 (key-value)
create table public.store_info (
  key   text primary key,
  value text
);

-- 9. 관리자 계정
create table public.admin_accounts (
  id            uuid primary key default gen_random_uuid(),
  username      text unique,
  password_hash text,
  role          text default 'order' check (role in ('super', 'product', 'order')),
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- 10. 감사 로그
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor      text,
  action     text,
  target     text,
  detail     jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security) 활성화
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.products        enable row level security;
alter table public.product_overrides enable row level security;
alter table public.custom_products enable row level security;
alter table public.flash_sale      enable row level security;
alter table public.orders          enable row level security;
alter table public.notices         enable row level security;
alter table public.store_info      enable row level security;
alter table public.admin_accounts  enable row level security;
alter table public.audit_logs      enable row level security;

-- ============================================================
-- RLS 정책
-- ============================================================

-- profiles: 본인만 읽기/수정, 관리자는 service_role로 접근
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- products: 누구나 조회 (숨김 제외)
create policy "products_select" on public.products
  for select using (not is_hidden);

-- product_overrides: 누구나 조회
create policy "overrides_select" on public.product_overrides
  for select using (true);

-- custom_products: 누구나 조회 (숨김 제외)
create policy "custom_products_select" on public.custom_products
  for select using (not is_hidden);

-- flash_sale: 누구나 조회
create policy "flash_sale_select" on public.flash_sale
  for select using (true);

-- orders: 본인 주문 조회, 인증된 사용자만 생성
create policy "orders_select" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders_insert" on public.orders
  for insert with check (auth.uid() = user_id);

-- notices: 누구나 조회
create policy "notices_select" on public.notices
  for select using (true);

-- store_info: 누구나 조회
create policy "store_info_select" on public.store_info
  for select using (true);

-- admin_accounts, audit_logs: 정책 없음 = service_role 전용

-- ============================================================
-- 트리거: 신규 회원 가입 시 profiles 자동 생성
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, phone, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',     ''),
    coalesce(new.raw_user_meta_data->>'phone',    ''),
    coalesce(new.raw_user_meta_data->>'provider', 'local')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- updated_at 자동 갱신 (products)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();
