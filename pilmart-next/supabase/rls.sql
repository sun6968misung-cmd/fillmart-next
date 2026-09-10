-- ================================================================
-- 필마트 Supabase RLS (Row Level Security) 설정
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 후 실행
-- ================================================================

-- ----------------------------------------------------------------
-- 1. orders 테이블 RLS
--    브라우저 클라이언트(createClient)가 직접 쿼리함
-- ----------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 본인 주문만 조회 (user_id가 현재 로그인 사용자와 일치하는 것만)
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT
  USING (user_id = auth.uid());

-- 로그인 사용자가 본인 명의로 주문 생성 (success/page.tsx에서 insert)
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 본인 주문만 수정 (취소: orders/page.tsx에서 update)
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 2. profiles 테이블 RLS
--    브라우저 클라이언트(createClient)가 직접 쿼리함
-- ----------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 조회 (checkout, profile 페이지)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- 본인 프로필만 수정 (profile/page.tsx 배송지 수정)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- INSERT는 service_role이 처리 (API route → createServiceClient)하므로 별도 정책 불필요

-- ----------------------------------------------------------------
-- 3. 소셜 로그인(카카오/네이버) 최초 가입 시 profiles 자동 생성
--    카카오/네이버 콜백은 브라우저에서 supabase.auth.signUp()만 호출하고
--    profiles 테이블에는 직접 INSERT하지 않음.
--    auth.users INSERT 트리거로 profiles를 자동 생성한다.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 이미 profiles 행이 있으면 (일반 가입은 API route에서 upsert) 건너뜀
  INSERT INTO public.profiles (id, phone, name, address, user_type, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    '',
    'personal',
    COALESCE(NEW.raw_user_meta_data->>'provider', 'local')
  )
  ON CONFLICT (id) DO NOTHING;  -- 일반 가입처럼 이미 upsert된 경우 무시
  RETURN NEW;
END;
$$;

-- auth.users에 INSERT될 때 트리거 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
