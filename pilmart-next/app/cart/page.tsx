'use client';
import Link from 'next/link';
import { ChevronRight, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/products';

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, total, goCheckout } = useCart();

  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="h-16 w-16 text-gray-200" />
        <p className="text-base font-medium text-gray-500">장바구니가 비어 있습니다</p>
        <Link href="/" className="mt-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
          쇼핑 계속하기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600 transition-colors">홈</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-700 font-medium">장바구니</span>
      </div>

      <h1 className="text-2xl font-bold mb-7">
        장바구니 <span className="text-primary">{itemCount}</span>
      </h1>

      <div className="flex gap-7 items-start">

        {/* 상품 목록 */}
        <div className="flex-1 min-w-0">
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* 테이블 헤더 */}
            <div className="hidden sm:flex bg-gray-50 items-center text-xs text-gray-400 font-medium px-5 py-3 border-b border-gray-100">
              <span className="flex-1">상품 정보</span>
              <span className="w-32 text-center">수량</span>
              <span className="w-28 text-right">금액</span>
              <span className="w-10" />
            </div>

            {/* 상품 행 */}
            {items.map(item => {
              const img = getProductImage(item.id);
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  {/* 이미지 */}
                  <div className="w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                    {img ? (
                      <img src={img} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">{item.emoji}</div>
                    )}
                  </div>

                  {/* 상품명+가격 */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.id}`}
                      className="text-sm font-medium text-gray-800 hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>
                    <p className="text-sm font-bold text-primary mt-1 sm:hidden">{formatPrice(item.price * item.qty)}</p>
                  </div>

                  {/* 수량 */}
                  <div className="w-32 flex justify-center shrink-0">
                    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-3 w-3 text-gray-600" />
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center text-sm font-bold border-x border-gray-200">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        disabled={!!item.maxQty && item.qty >= item.maxQty}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3 w-3 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* 금액 */}
                  <div className="w-28 text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.qty)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">개당 {formatPrice(item.price)}</p>
                  </div>

                  {/* 삭제 */}
                  <div className="shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      aria-label="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 하단 액션 */}
          <div className="flex justify-between mt-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
              ← 쇼핑 계속하기
            </Link>
            <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
              전체 삭제
            </button>
          </div>
        </div>

        {/* 주문 요약 */}
        <div className="w-72 shrink-0 border border-gray-100 rounded-xl overflow-hidden sticky top-32">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">주문 요약</h2>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>상품 금액</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
              <span className="text-gray-900">합계</span>
              <span className="text-primary text-lg">{formatPrice(total)}</span>
            </div>
          </div>
          <div className="px-5 pb-5 space-y-2">
            <button
              onClick={goCheckout}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              결제하기
            </button>
            <p className="text-[11px] text-gray-400 text-center">최소 주문 금액 100,000원</p>
          </div>
        </div>
      </div>
    </div>
  );
}
