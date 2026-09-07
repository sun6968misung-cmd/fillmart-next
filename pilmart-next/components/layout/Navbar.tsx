'use client';
import Link from 'next/link';
import { ShoppingCart, Heart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { count, openCart } = useCart();
  const { count: wishCount } = useWishlist();
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="필마트" width={32} height={32} className="rounded" />
          <span className="text-xl font-bold text-primary">필마트</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-primary transition-colors">홈</Link>
          <Link href="/notice" className="hover:text-primary transition-colors">공지사항</Link>
          <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">고객문의</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {count}
              </Badge>
            )}
          </Button>

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              {wishCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {wishCount}
                </Badge>
              )}
            </Button>
          </Link>

          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user?.name}님</span>
              <Button variant="outline" size="sm" onClick={logout}>로그아웃</Button>
              <Link href="/orders"><Button variant="ghost" size="sm">주문내역</Button></Link>
            </div>
          ) : (
            <Link href="/auth" className="hidden md:block">
              <Button variant="outline" size="sm">로그인</Button>
            </Link>
          )}

          {/* 모바일 햄버거 */}
          <Sheet>
            <SheetTrigger render={<button className="md:hidden inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground"><Menu className="h-5 w-5" /></button>} />
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-medium">홈</Link>
                <Link href="/notice" className="text-lg font-medium">공지사항</Link>
                <Link href="/faq" className="text-lg font-medium">FAQ</Link>
                <Link href="/contact" className="text-lg font-medium">고객문의</Link>
                {isLoggedIn ? (
                  <>
                    <Link href="/orders" className="text-lg font-medium">주문내역</Link>
                    <button onClick={logout} className="text-left text-lg font-medium text-destructive">로그아웃</button>
                  </>
                ) : (
                  <Link href="/auth" className="text-lg font-medium">로그인</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
