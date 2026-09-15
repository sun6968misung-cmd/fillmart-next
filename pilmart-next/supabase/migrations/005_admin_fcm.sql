-- 관리자 앱 푸시 알림 — admin_accounts에 FCM 토큰 컬럼 추가
-- 주문 접수 시 활성 관리자 전체에게 푸시를 보내기 위해 사용.
-- Supabase 대시보드 SQL 에디터에서 직접 실행할 것 (다른 마이그레이션과 동일한 방식).

alter table public.admin_accounts
  add column if not exists fcm_token text;
