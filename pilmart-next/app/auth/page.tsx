'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { hashPassword } from '@/lib/crypto';
import { StoredUser } from '@/types';
import { KEYS, lsGet, lsSet } from '@/lib/storage';

function AuthForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/';

  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', password: '', confirm: '' });
  const [userType, setUserType] = useState<'personal' | 'business'>('personal');
  const [bizForm, setBizForm] = useState({ businessNo: '', businessName: '', businessType: '', businessCategory: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.phone || !loginForm.password) {
      toast.error('전화번호와 비밀번호를 입력해주세요.');
      return;
    }
    const users = lsGet<StoredUser[]>(KEYS.users, []);
    const stored = users.find(u => u.phone === loginForm.phone);
    if (!stored) {
      toast.error('전화번호 또는 비밀번호가 올바르지 않습니다.');
      return;
    }
    const hash = await hashPassword(loginForm.password);
    if (hash !== stored.passwordHash) {
      toast.error('전화번호 또는 비밀번호가 올바르지 않습니다.');
      return;
    }
    login({ name: stored.name, phone: stored.phone, loginAt: Date.now(), provider: 'local' });
    toast.success('로그인되었습니다.');
    router.push(redirect);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.phone || !signupForm.password) {
      toast.error('모든 항목을 입력해주세요.');
      return;
    }
    if (signupForm.password !== signupForm.confirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    const users = lsGet<StoredUser[]>(KEYS.users, []);
    if (users.find(u => u.phone === signupForm.phone)) {
      toast.error('이미 등록된 전화번호입니다.');
      return;
    }
    if (userType === 'business' && (!bizForm.businessNo.trim() || !bizForm.businessName.trim())) {
      toast.error('사업자 등록번호와 상호명을 입력해주세요.');
      return;
    }
    const passwordHash = await hashPassword(signupForm.password);
    const newUser: import('@/types').StoredUser = {
      phone: signupForm.phone,
      name: signupForm.name,
      passwordHash,
      userType,
      ...(userType === 'business' ? bizForm : {}),
    };
    lsSet(KEYS.users, [...users, newUser]);
    login({ name: signupForm.name, phone: signupForm.phone, loginAt: Date.now(), provider: 'local' });
    toast.success('회원가입이 완료되었습니다.');
    router.push(redirect);
  };

  return (
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
                  <Input id="login-phone" placeholder="010-0000-0000" value={loginForm.phone} onChange={e => setLoginForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-pw">비밀번호</Label>
                  <Input id="login-pw" type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full">로그인</Button>
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
                  <Label htmlFor="signup-name">이름</Label>
                  <Input id="signup-name" placeholder="홍길동" value={signupForm.name} onChange={e => setSignupForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">전화번호</Label>
                  <Input id="signup-phone" placeholder="010-0000-0000" value={signupForm.phone} onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-pw">비밀번호</Label>
                  <Input id="signup-pw" type="password" value={signupForm.password} onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">비밀번호 확인</Label>
                  <Input id="signup-confirm" type="password" value={signupForm.confirm} onChange={e => setSignupForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                {userType === 'business' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">사업자 정보</p>
                    <div className="space-y-2">
                      <Label htmlFor="biz-no">사업자 등록번호</Label>
                      <Input id="biz-no" placeholder="000-00-00000" value={bizForm.businessNo} onChange={e => setBizForm(p => ({ ...p, businessNo: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-name">상호명</Label>
                      <Input id="biz-name" placeholder="OO마트" value={bizForm.businessName} onChange={e => setBizForm(p => ({ ...p, businessName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-type">업종</Label>
                      <Input id="biz-type" placeholder="도소매" value={bizForm.businessType} onChange={e => setBizForm(p => ({ ...p, businessType: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-cat">업태</Label>
                      <Input id="biz-cat" placeholder="식품" value={bizForm.businessCategory} onChange={e => setBizForm(p => ({ ...p, businessCategory: e.target.value }))} />
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full">회원가입</Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />
          <p className="text-xs text-center text-muted-foreground">소셜 로그인은 준비 중입니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>;
}
