'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, MapPin, Phone, Search, LogOut } from 'lucide-react';
import Script from 'next/script';
import { useAuth } from '@/context/StoreProvider';

declare global {
  interface Window {
    daum: {
      Postcode: new (opts: { oncomplete: (data: { zonecode: string; roadAddress: string }) => void }) => { open: () => void };
    };
  }
}

interface Profile {
  name: string;
  phone: string;
  address: string;
  user_type: 'personal' | 'business';
  business_no?: string;
  business_name?: string;
  business_type?: string;
  business_category?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [zonecode, setZonecode] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth?redirect=/profile'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('name, phone, address, user_type, business_no, business_name, business_type, business_category')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        setNewAddress(data.address ?? '');
      } else {
        // 소셜 로그인 최초 가입 시 profiles 행이 없을 수 있음 (트리거 미실행 환경 방어)
        const meta = user.user_metadata ?? {};
        setProfile({
          name: meta.name ?? '',
          phone: meta.phone ?? '',
          address: '',
          user_type: 'personal',
        });
      }
    })();
  }, [router]);

  function openPostcode() {
    new window.daum.Postcode({
      oncomplete(data) {
        setZonecode(data.zonecode);
        setRoadAddress(data.roadAddress);
        setDetailAddress('');
        setNewAddress(`(${data.zonecode}) ${data.roadAddress}`);
      },
    }).open();
  }

  const fullNewAddress = roadAddress
    ? `(${zonecode}) ${roadAddress}${detailAddress ? ' ' + detailAddress : ''}`
    : newAddress;

  async function handleSave() {
    if (!fullNewAddress.trim()) { toast.error('주소를 입력해주세요.'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ address: fullNewAddress })
        .eq('id', user.id);
      if (error) { toast.error('저장에 실패했습니다.'); return; }
      setProfile(prev => prev ? { ...prev, address: fullNewAddress } : prev);
      setEditing(false);
      toast.success('주소가 업데이트되었습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <div className="container mx-auto px-4 py-8 max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">마이페이지</h1>

        {/* 기본 정보 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> 기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">이름</span>
              <span className="font-medium">{profile.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> 전화번호</span>
              <span className="font-medium">{profile.phone}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">회원 유형</span>
              <span className="font-medium">{profile.user_type === 'business' ? '사업자' : '개인'}</span>
            </div>
          </CardContent>
        </Card>

        {/* 사업자 정보 */}
        {profile.user_type === 'business' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">사업자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {profile.business_no && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">사업자번호</span>
                    <span className="font-medium">{profile.business_no}</span>
                  </div>
                  <Separator />
                </>
              )}
              {profile.business_name && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상호명</span>
                    <span className="font-medium">{profile.business_name}</span>
                  </div>
                  <Separator />
                </>
              )}
              {profile.business_type && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">업태</span>
                    <span className="font-medium">{profile.business_type}</span>
                  </div>
                  <Separator />
                </>
              )}
              {profile.business_category && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">업종</span>
                  <span className="font-medium">{profile.business_category}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 배송지 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> 기본 배송지
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!editing ? (
              <>
                <p className="text-sm">{profile.address || '등록된 주소가 없습니다.'}</p>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  배송지 수정
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">새 주소</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      placeholder="주소 검색 버튼을 누르세요"
                      value={fullNewAddress}
                      className="flex-1 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={openPostcode}>
                      <Search className="h-3.5 w-3.5 mr-1" /> 검색
                    </Button>
                  </div>
                </div>
                {roadAddress && (
                  <Input
                    placeholder="상세 주소 (동/호수 등)"
                    value={detailAddress}
                    onChange={e => {
                      setDetailAddress(e.target.value);
                      setNewAddress(`(${zonecode}) ${roadAddress}${e.target.value ? ' ' + e.target.value : ''}`);
                    }}
                    className="text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading} size="sm" className="flex-1">
                    {loading ? '저장 중...' : '저장'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setRoadAddress(''); setDetailAddress(''); setNewAddress(profile.address ?? ''); }}>
                    취소
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 로그아웃 */}
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => { void logout(); }}
        >
          <LogOut className="h-4 w-4 mr-2" /> 로그아웃
        </Button>
      </div>
    </>
  );
}
