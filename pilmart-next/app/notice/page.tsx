'use client';
import { useEffect, useState } from 'react';
import { Notice } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  useEffect(() => {
    fetch('/api/notices')
      .then(r => r.json())
      .then((rows: Record<string, unknown>[]) =>
        setNotices(rows.map(row => ({
          id: row.id as string,
          title: row.title as string,
          content: row.content as string,
          createdAt: new Date(row.created_at as string).getTime(),
          important: row.is_pinned as boolean,
        })))
      );
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">공지사항</h1>
      {notices.length === 0
        ? <p className="text-muted-foreground text-center py-16">등록된 공지가 없습니다.</p>
        : (
          <Accordion className="space-y-2">
            {notices.map(n => (
              <AccordionItem key={n.id} value={n.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {n.important && <Badge>중요</Badge>}
                    <span>{n.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto mr-4">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground pb-4">{n.content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      }
    </div>
  );
}
