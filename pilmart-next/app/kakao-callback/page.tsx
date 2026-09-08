'use client';
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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

    if (!access_token) {
      router.replace('/auth');
      return;
    }

    fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(res => res.json())
      .then((data: KakaoUserResponse) => {
        const name = data.kakao_account?.profile?.nickname ?? '카카오 사용자';
        const rawPhone = data.kakao_account?.phone_number ?? '';
        // "+82 10-1234-5678" → "01012345678"
        const phone = rawPhone.startsWith('+82 ')
          ? '0' + rawPhone.slice(4).replace(/-/g, '')
          : rawPhone.replace(/-/g, '');

        login({ name, phone, loginAt: Date.now(), provider: 'kakao' });
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
