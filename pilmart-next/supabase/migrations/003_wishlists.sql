-- 위시리스트 테이블
create table if not exists public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  text not null,
  created_at  timestamptz default now(),
  unique (user_id, product_id)
);

alter table public.wishlists enable row level security;

-- 본인 행만 읽기/쓰기 허용
create policy "users_own_wishlist" on public.wishlists
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
