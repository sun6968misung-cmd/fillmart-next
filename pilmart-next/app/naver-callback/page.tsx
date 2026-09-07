'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function NaverCallback() {
  const params = useSearchParams();
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const access_token = new URLSearchParams(hash.replace('#', '?')).get('access_token');
    if (access_token) {
      login({ name: '네이버 사용자', phone: '', loginAt: Date.now(), provider: 'naver' });
    }
    router.replace('/');
  }, []);

  return <p className="text-center py-16">로그인 처리 중...</p>;
}

export default function NaverCallbackPage() {
  return <Suspense><NaverCallback /></Suspense>;
}
