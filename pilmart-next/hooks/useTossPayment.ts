'use client';

declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
    };
  }
}

export function useTossPayment() {
  const requestPayment = async (method: string, orderInfo: Record<string, unknown>) => {
    const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
    const origin = window.location.origin;
    await toss.requestPayment(method, {
      ...orderInfo,
      successUrl: `${origin}/success`,
      failUrl: `${origin}/fail`,
    });
  };
  return { requestPayment };
}
