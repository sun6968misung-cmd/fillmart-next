'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

function FailContent() {
  const params = useSearchParams();
  const message = params.get('message') ?? '결제가 취소되었습니다.';

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-6">
      <XCircle className="h-16 w-16 text-destructive mx-auto" />
      <h1 className="text-2xl font-bold">결제 실패</h1>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex gap-3 justify-center">
        <Link href="/checkout"><Button variant="outline">다시 시도</Button></Link>
        <Link href="/"><Button>홈으로</Button></Link>
      </div>
    </div>
  );
}

export default function FailPage() {
  return <Suspense><FailContent /></Suspense>;
}
