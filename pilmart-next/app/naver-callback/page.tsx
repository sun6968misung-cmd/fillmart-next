'use client';
import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

function NaverCallback() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const access_token = new URLSearchParams(hash.replace('#', '?')).get('access_token');

    if (!access_token) {
      router.replace('/auth');
      return;
    }

    fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(res => res.json())
      .then((data: { resultcode: string; response?: { name?: string; mobile?: string } }) => {
        if (data.resultcode === '00' && data.response) {
          login({
            name: data.response.name ?? '네이버 사용자',
            phone: data.response.mobile?.replace(/-/g, '') ?? '',
            loginAt: Date.now(),
            provider: 'naver',
          });
          router.replace('/');
        } else {
          toast.error('네이버 로그인에 실패했습니다.');
          router.replace('/auth');
        }
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
