import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQS = [
  { q: '배송 지역은 어디인가요?', a: '현재 전국 배송 가능합니다. 도서산간 지역은 추가 배송비가 발생할 수 있습니다.' },
  { q: '최소 주문금액이 있나요?', a: '최소 주문금액은 100,000원입니다.' },
  { q: '당일 배송 조건은 무엇인가요?', a: '오전 11시 이전 주문 시 당일 오후 배송됩니다.' },
  { q: '교환/환불은 어떻게 하나요?', a: '신선식품 특성상 수령 후 24시간 이내 고객문의 페이지를 통해 접수해주세요.' },
  { q: '회원 가입 혜택이 있나요?', a: '회원 가입 시 첫 주문 무료배송 혜택이 제공됩니다.' },
];

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">자주 묻는 질문</h1>
      <Accordion className="space-y-2">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline text-left">{f.q}</AccordionTrigger>
            <AccordionContent><p className="text-muted-foreground pb-4">{f.a}</p></AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
