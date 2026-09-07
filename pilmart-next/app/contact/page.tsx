'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', title: '', content: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('제목과 내용을 입력해주세요.'); return; }
    toast.success('문의가 접수되었습니다. 1-2일 내에 답변드리겠습니다.');
    setForm({ name: '', phone: '', title: '', content: '' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader><CardTitle>고객문의</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {([['name', '이름'], ['phone', '전화번호'], ['title', '제목'], ['content', '문의 내용']] as const).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Input id={field} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
            <Button type="submit" className="w-full">문의 접수</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
