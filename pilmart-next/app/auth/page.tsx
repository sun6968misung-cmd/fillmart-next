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

function AuthForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/';

  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', password: '', confirm: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.phone || !loginForm.password) { toast.error('전화번호와 비밀번호를 입력해주세요.'); return; }
    login({ name: loginForm.phone, phone: loginForm.phone, loginAt: Date.now(), provider: 'local' });
    toast.success('로그인되었습니다.');
    router.push(redirect);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.phone || !signupForm.password) { toast.error('모든 항목을 입력해주세요.'); return; }
    if (signupForm.password !== signupForm.confirm) { toast.error('비밀번호가 일치하지 않습니다.'); return; }
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
