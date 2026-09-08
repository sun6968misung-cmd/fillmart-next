'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { KEYS, lsGet } from '@/lib/storage';

interface Notice {
  id?: string | number;
  title: string;
  date?: string;
  createdAt?: string;
  content?: string;
}

export function NoticePreview() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    function load() {
      const all = lsGet<Notice[]>(KEYS.notices, []);
      setNotices([...all].reverse().slice(0, 3));
    }
    load();
    window.addEventListener('pilmart:store-synced', load);
    return () => window.removeEventListener('pilmart:store-synced', load);
  }, []);

  if (notices.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">공지사항</h2>
        <Link
          href="/notice"
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          더보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        {notices.map((notice, i) => {
          const dateStr = notice.date ?? notice.createdAt ?? '';
          return (
            <div key={notice.id ?? i}>
              {i > 0 && <Separator />}
              <Link
                href="/notice"
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {dateStr && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {dateStr.slice(0, 10)}
                    </span>
                  )}
                  <span className="text-sm font-medium truncate">{notice.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
