import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreProvider';
import { ServerSyncProvider } from '@/components/ServerSyncProvider';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '필식자재마마트 다사점 — 신선식품 당일배송',
  description: '신선한 야채, 과일, 육류, 수산물을 당일배송으로 만나보세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={geist.className}>
        <Script src="https://js.tosspayments.com/v1/payment" strategy="beforeInteractive" />
        <StoreProvider>
          <ServerSyncProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster richColors position="top-center" />
          </ServerSyncProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
