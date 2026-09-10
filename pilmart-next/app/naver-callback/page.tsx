'use client';
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/StoreProvider';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

function NaverCallback() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const access_token = new URLSearchParams(hash.replace('#', '?')).get('access_token');
    if (!access_token) { router.replace('/auth'); return; }

    fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(res => res.json())
      .then(async (data: { resultcode: string; response?: { id?: string; name?: string; mobile?: string } }) => {
        if (data.resultcode !== '00' || !data.response) {
          toast.error('네이버 로그인에 실패했습니다.');
          router.replace('/auth');
          return;
        }
        const name = data.response.name ?? '네이버 사용자';
        const phone = data.response.mobile?.replace(/-/g, '') ?? '';
        const naverId = data.response.id ?? '';

        const supabase = createClient();
        const email = `${phone || `naver_${naverId}`}@naver.pilmart.com`;
        // 네이버 ID 기반 결정적 패스워드 (Supabase 세션 생성용)
        const password = `nv_${naverId}_pilmart`;

        // 먼저 로그인 시도 (기존 계정)
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          // 최초 로그인: 계정 생성 후 로그인
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, phone, provider: 'naver' } },
          });
          if (signUpErr && !signUpErr.message.toLowerCase().includes('already registered')) {
            toast.error('네이버 로그인을 처리할 수 없습니다.');
            router.replace('/auth');
            return;
          }
          await supabase.auth.signInWithPassword({ email, password });
        }

        login({ name, phone, loginAt: Date.now(), provider: 'naver' });
        router.replace('/');
      })
      .catch(() => {
        toast.error('네이버 로그인을 처리할 수 없습니다.');
        router.replace('/auth');
      });
  }, [login, router]);

  return <p className="text-center py-16">로그인 처리 중...</p>;
}

export default function NaverCallbackPage() {
  return <Suspense><NaverCallback /></Suspense>;
}
