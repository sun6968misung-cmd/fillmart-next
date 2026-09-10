'use client';
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/StoreProvider';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    profile?: { nickname?: string };
    phone_number?: string;
  };
}

function KakaoCallback() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const access_token = new URLSearchParams(hash.replace('#', '?')).get('access_token');
    if (!access_token) { router.replace('/auth'); return; }

    fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(res => res.json())
      .then(async (data: KakaoUserResponse) => {
        const name = data.kakao_account?.profile?.nickname ?? '카카오 사용자';
        const rawPhone = data.kakao_account?.phone_number ?? '';
        const phone = rawPhone.startsWith('+82 ')
          ? '0' + rawPhone.slice(4).replace(/-/g, '')
          : rawPhone.replace(/-/g, '');

        const supabase = createClient();
        const email = `${phone || `kakao_${data.id}`}@kakao.pilmart.com`;
        // 카카오 ID 기반 결정적 패스워드 (Supabase 세션 생성용)
        const password = `kko_${data.id}_pilmart`;

        // 먼저 로그인 시도 (기존 계정)
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          // 최초 로그인: 계정 생성 후 로그인
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, phone: phone || '', provider: 'kakao' } },
          });
          if (signUpErr && !signUpErr.message.toLowerCase().includes('already registered')) {
            toast.error('카카오 로그인을 처리할 수 없습니다.');
            router.replace('/auth');
            return;
          }
          // 가입 직후 재로그인
          await supabase.auth.signInWithPassword({ email, password });
        }

        login({ name, phone: phone || '', loginAt: Date.now(), provider: 'kakao' });
        router.replace('/');
      })
      .catch(() => {
        toast.error('카카오 로그인을 처리할 수 없습니다.');
        router.replace('/auth');
      });
  }, [login, router]);

  return <p className="text-center py-16 text-muted-foreground">카카오 로그인 처리 중...</p>;
}

export default function KakaoCallbackPage() {
  return <Suspense><KakaoCallback /></Suspense>;
}
