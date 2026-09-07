'use client';
import { useEffect, useState } from 'react';
import { KEYS, lsGet, lsSet } from '@/lib/storage';
import { Order, Notice, StoreInfo, ProductOverride } from '@/types';
import { PRODUCTS } from '@/lib/products';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ name: '필마트', phone: '', address: '' });
  const [overrides, setOverrides] = useState<Record<string, ProductOverride>>({});
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });

  useEffect(() => {
    if (!authed) return;
    setOrders(lsGet<Order[]>(KEYS.orders, []));
    setNotices(lsGet<Notice[]>(KEYS.notices, []));
    setStoreInfo(lsGet<StoreInfo>(KEYS.storeInfo, { name: '필마트', phone: '', address: '' }));
    setOverrides(lsGet<Record<string, ProductOverride>>(KEYS.products, {}));
  }, [authed]);

  const handleLogin = () => {
    const saved = lsGet<string>(KEYS.adminPw, '1234');
    if (pw === saved) { setAuthed(true); }
    else { toast.error('비밀번호가 틀렸습니다.'); }
  };

  if (!authed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">관리자</h1>
        <div className="space-y-2">
          <Label>비밀번호</Label>
          <Input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <Button className="w-full" onClick={handleLogin}>로그인</Button>
      </div>
    );
  }

  const saveOverride = (id: string, field: keyof ProductOverride, value: string | number) => {
    const next = { ...overrides, [id]: { ...overrides[id], [field]: value } };
    setOverrides(next);
    lsSet(KEYS.products, next);
    toast.success('저장됨');
  };

  const addNotice = () => {
    if (!newNotice.title) { toast.error('제목을 입력해주세요.'); return; }
    const n: Notice = { id: Date.now().toString(), ...newNotice, createdAt: Date.now() };
    const next = [n, ...notices];
    setNotices(next);
    lsSet(KEYS.notices, next);
    setNewNotice({ title: '', content: '' });
    toast.success('공지가 등록되었습니다.');
  };

  const removeNotice = (id: string) => {
    const next = notices.filter(n => n.id !== id);
    setNotices(next);
    lsSet(KEYS.notices, next);
  };

  const saveStoreInfo = () => {
    lsSet(KEYS.storeInfo, storeInfo);
    toast.success('저장됨');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">관리자</h1>
      <Tabs defaultValue="orders">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="orders">주문</TabsTrigger>
          <TabsTrigger value="products">상품</TabsTrigger>
          <TabsTrigger value="notices">공지</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* 주문 탭 */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader><CardTitle>주문 내역 ({orders.length}건)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>주문번호</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>결제수단</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o.orderId}>
                      <TableCell className="text-xs text-muted-foreground">{o.orderId.slice(-8)}</TableCell>
                      <TableCell className="text-sm">{new Date(o.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell className="font-medium">{formatPrice(o.total)}</TableCell>
                      <TableCell>{o.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상품 탭 */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader><CardTitle>상품 가격/이름 수정</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>기본 가격</TableHead>
                    <TableHead>수정 가격</TableHead>
                    <TableHead>저장</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRODUCTS.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatPrice(p.price)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-28"
                          defaultValue={overrides[p.id]?.price ?? p.price}
                          onBlur={e => saveOverride(p.id, 'price', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => saveOverride(p.id, 'price', overrides[p.id]?.price ?? p.price)}>저장</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 공지 탭 */}
        <TabsContent value="notices" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>공지 등록</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input value={newNotice.title} onChange={e => setNewNotice(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>내용</Label>
                <Input value={newNotice.content} onChange={e => setNewNotice(p => ({ ...p, content: e.target.value }))} />
              </div>
              <Button onClick={addNotice}>등록</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>공지 목록</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>제목</TableHead><TableHead>날짜</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map(n => (
                    <TableRow key={n.id}>
                      <TableCell>{n.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell><Button size="sm" variant="destructive" onClick={() => removeNotice(n.id)}>삭제</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader><CardTitle>매장 정보</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(['name', 'phone', 'address', 'hours'] as const).map(field => (
                <div key={field} className="space-y-2">
                  <Label>{field === 'name' ? '매장명' : field === 'phone' ? '전화번호' : field === 'address' ? '주소' : '영업시간'}</Label>
                  <Input value={(storeInfo as unknown as Record<string, string>)[field] ?? ''} onChange={e => setStoreInfo(p => ({ ...p, [field]: e.target.value }))} />
                </div>
              ))}
              <Button onClick={saveStoreInfo}>저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
