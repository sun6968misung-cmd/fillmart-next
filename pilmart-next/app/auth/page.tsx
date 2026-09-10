'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase';

declare global {
  interface Window {
    daum: {
      Postcode: new (opts: { oncomplete: (data: { zonecode: string; roadAddress: string }) => void }) => { open: () => void };
    };
  }
}

function SocialLoginButtons() {
  const handleKakao = () => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!appKey) { toast.error('카카오 앱 키가 설정되지 않았습니다.'); return; }
    const callbackUrl = `${window.location.origin}/kakao-callback`;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${appKey}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=token`;
  };

  const handleNaver = () => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    if (!clientId) { toast.error('네이버 클라이언트 ID가 설정되지 않았습니다.'); return; }
    const callbackUrl = `${window.location.origin}/naver-callback`;
    const state = Math.random().toString(36).slice(2);
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-center text-muted-foreground mb-4">소셜 계정으로 간편 로그인</p>
      <button type="button" onClick={handleKakao}
        className="w-full flex items-center justify-center gap-3 h-12 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
        style={{ backgroundColor: '#FEE500', color: '#191919' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
          <path d="M12 3C6.48 3 2 6.93 2 11.74c0 3.17 1.88 5.95 4.73 7.57L6 22l3.35-1.75c.85.19 1.73.3 2.65.3 5.52 0 10-3.93 10-8.74S17.52 3 12 3z" />
        </svg>
        카카오톡으로 계속하기
      </button>
      <button type="button" onClick={handleNaver}
        className="w-full flex items-center justify-center gap-3 h-12 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
        style={{ backgroundColor: '#03C75A', color: '#ffffff' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
          <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
        </svg>
        네이버로 계속하기
      </button>
    </div>
  );
}

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/';

  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', password: '', confirm: '' });
  const [userType, setUserType] = useState<'personal' | 'business'>('personal');
  const [bizForm, setBizForm] = useState({ businessNo: '', businessName: '', businessType: '', businessCategory: '' });
  const [zonecode, setZonecode] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const fullAddress = roadAddress
    ? `(${zonecode}) ${roadAddress}${detailAddress ? ' ' + detailAddress : ''}`
    : '';

  function openPostcode() {
    new window.daum.Postcode({
      oncomplete(data) {
        setZonecode(data.zonecode);
        setRoadAddress(data.roadAddress);
        setDetailAddress('');
      },
    }).open();
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.phone || !loginForm.password) {
      toast.error('전화번호와 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const phone = loginForm.phone.replace(/-/g, '');
      const { error } = await supabase.auth.signInWithPassword({
        email: `${phone}@pilmart.com`,
        password: loginForm.password,
      });
      if (error) {
        toast.error('전화번호 또는 비밀번호가 올바르지 않습니다.');
        return;
      }
      toast.success('로그인되었습니다.');
      router.push(redirect);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name.trim()) { toast.error('성명을 입력해주세요.'); return; }
    if (!signupForm.phone.trim()) { toast.error('전화번호를 입력해주세요.'); return; }
    if (!fullAddress) { toast.error('주소를 검색하여 입력해주세요.'); return; }
    if (!signupForm.password) { toast.error('비밀번호를 입력해주세요.'); return; }
    if (signupForm.password !== signupForm.confirm) { toast.error('비밀번호가 일치하지 않습니다.'); return; }
    if (userType === 'business' && (!bizForm.businessNo.trim() || !bizForm.businessName.trim())) {
      toast.error('사업자 등록번호와 상호명을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: signupForm.phone,
          password: signupForm.password,
          name: signupForm.name,
          address: fullAddress,
          userType,
          ...(userType === 'business' ? {
            businessNo: bizForm.businessNo,
            businessName: bizForm.businessName,
            businessType: bizForm.businessType,
            businessCategory: bizForm.businessCategory,
          } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? '회원가입에 실패했습니다.');
        return;
      }

      const supabase = createClient();
      const phone = signupForm.phone.replace(/-/g, '');
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: `${phone}@pilmart.com`,
        password: signupForm.password,
      });
      if (signInErr) {
        toast.error('회원가입은 완료되었지만 로그인에 실패했습니다. 다시 로그인해주세요.');
        return;
      }

      toast.success('회원가입이 완료되었습니다.');
      router.push(redirect);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">필마트</CardTitle>
            <p className="text-muted-foreground text-sm">신선식품 당일배송 쇼핑몰</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">로그인</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">회원가입</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">전화번호</Label>
                    <Input id="login-phone" placeholder="010-0000-0000" value={loginForm.phone}
                      onChange={e => setLoginForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-pw">비밀번호</Label>
                    <Input id="login-pw" type="password" value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? '로그인 중...' : '로그인'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>회원 유형</Label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      {(['personal', 'business'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setUserType(t)}
                          className={`flex-1 py-2 text-sm font-semibold transition-colors ${userType === t ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                          {t === 'personal' ? '일반' : '사업자'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">성명 <span className="text-red-500">*</span></Label>
                    <Input id="signup-name" placeholder="홍길동" value={signupForm.name}
                      onChange={e => setSignupForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">전화번호 <span className="text-red-500">*</span></Label>
                    <Input id="signup-phone" placeholder="010-0000-0000" value={signupForm.phone}
                      onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>주소 <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input readOnly placeholder="우편번호" value={zonecode} className="w-28 bg-gray-50" />
                      <Button type="button" variant="outline" onClick={openPostcode} className="shrink-0 gap-1.5">
                        <Search className="h-4 w-4" /> 주소 검색
                      </Button>
                    </div>
                    <Input readOnly placeholder="도로명 주소" value={roadAddress} className="bg-gray-50" />
                    <Input placeholder="상세주소 (동·호수 등)" value={detailAddress}
                      onChange={e => setDetailAddress(e.target.value)} disabled={!roadAddress} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-pw">비밀번호 <span className="text-red-500">*</span></Label>
                    <Input id="signup-pw" type="password" value={signupForm.password}
                      onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">비밀번호 확인 <span className="text-red-500">*</span></Label>
                    <Input id="signup-confirm" type="password" value={signupForm.confirm}
                      onChange={e => setSignupForm(p => ({ ...p, confirm: e.target.value }))} />
                  </div>
                  {userType === 'business' && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">사업자 정보</p>
                      <div className="space-y-2">
                        <Label htmlFor="biz-no">사업자 등록번호 <span className="text-red-500">*</span></Label>
                        <Input id="biz-no" placeholder="000-00-00000" value={bizForm.businessNo}
                          onChange={e => setBizForm(p => ({ ...p, businessNo: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="biz-name">상호명 <span className="text-red-500">*</span></Label>
                        <Input id="biz-name" placeholder="OO마트" value={bizForm.businessName}
                          onChange={e => setBizForm(p => ({ ...p, businessName: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="biz-type">업종</Label>
                        <Input id="biz-type" placeholder="도소매" value={bizForm.businessType}
                          onChange={e => setBizForm(p => ({ ...p, businessType: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="biz-cat">업태</Label>
                        <Input id="biz-cat" placeholder="식품" value={bizForm.businessCategory}
                          onChange={e => setBizForm(p => ({ ...p, businessCategory: e.target.value }))} />
                      </div>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? '처리 중...' : '회원가입'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />
            <SocialLoginButtons />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>;
}
