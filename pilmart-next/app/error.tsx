'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-7xl mb-6">⚠️</p>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">문제가 발생했어요</h2>
      <p className="text-sm text-gray-500 mb-8">
        일시적인 오류입니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-primary text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-primary/90 transition-colors"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-full text-sm hover:bg-gray-50 transition-colors"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
