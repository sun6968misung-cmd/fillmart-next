'use client';
import { useEffect, useState } from 'react';
import { Order } from '@/types';
import { KEYS, lsGet } from '@/lib/storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(lsGet<Order[]>(KEYS.orders, []));
  }, []);

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">주문내역</h1>
        <p className="text-muted-foreground">주문 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">주문내역</h1>
      <Accordion className="space-y-3">
        {orders.map(order => (
          <AccordionItem key={order.orderId} value={order.orderId} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-4 text-left">
                <div>
                  <p className="font-medium text-sm">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</p>
                  <p className="text-muted-foreground text-xs">{order.orderId}</p>
                </div>
                <Badge variant="outline">{order.method}</Badge>
                <span className="text-primary font-semibold ml-auto mr-4">{formatPrice(order.total)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 pb-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} × {item.qty}</span>
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
