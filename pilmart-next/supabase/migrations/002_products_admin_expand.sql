-- product_overrides 재생성 (UUID FK 제거, TEXT PK, 16개 컬럼)
drop table if exists public.product_overrides;
create table public.product_overrides (
  product_id          text primary key,
  name                text,
  price               integer,
  original_price      integer,
  image_url           text,
  detail_image_url    text,
  category            text,
  description         text,
  unit                text,
  origin              text,
  storage             text,
  expiry_date         text,
  product_info        text,
  customer_service_no text,
  hidden              boolean default false,
  tax_type            text default 'taxFree'
);
alter table public.product_overrides enable row level security;
create policy "overrides_public_read" on public.product_overrides
  for select using (true);

-- custom_products 누락 컬럼 추가
alter table public.custom_products
  add column if not exists original_price      integer,
  add column if not exists detail_image_url    text,
  add column if not exists origin              text,
  add column if not exists storage             text,
  add column if not exists expiry_date         text,
  add column if not exists product_info        text,
  add column if not exists customer_service_no text;

-- admin_accounts: super 레코드 삽입
-- __PENDING__ 의미: 배포 후 첫 로그인(기본 비밀번호 1234)에서 bcrypt로 자동 교체됨
insert into public.admin_accounts (username, password_hash, role, is_active)
values ('__super__', '__PENDING__', 'super', true)
on conflict (username) do nothing;

-- audit_logs 자동 정리: 1000건 초과 시 오래된 것부터 삭제
create or replace function public.trim_audit_logs()
returns trigger language plpgsql as $$
begin
  delete from public.audit_logs
  where id in (
    select id from public.audit_logs
    order by created_at desc
    offset 1000
  );
  return new;
end;
$$;

drop trigger if exists audit_logs_trim on public.audit_logs;
create trigger audit_logs_trim
  after insert on public.audit_logs
  for each row execute procedure public.trim_audit_logs();
