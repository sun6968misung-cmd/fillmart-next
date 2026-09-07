'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, Maximize2 } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    bg: '#f5ede0',
    badge: '🥬 이번주특가',
    title: '신선한 야채·과일을\n농가에서 직송',
    subtitle: '산지 직거래로 더 신선하게, 더 저렴하게',
    cta: '특가 보기',
    href: '/category/vegetables',
    imgSrc: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&h=420&q=80',
    badgeColor: '#eb3800',
  },
  {
    id: 2,
    bg: '#fef3e2',
    badge: '🌶️ 양념/소스 특가',
    title: '가게·업소용\n소스·양념 한정 할인',
    subtitle: '고추장·된장·간장부터 업소용 대용량까지',
    cta: '지금 보기',
    href: '/category/sauce',
    imgSrc: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&h=420&q=80',
    badgeColor: '#d97706',
  },
  {
    id: 3,
    bg: '#fce8e6',
    badge: '🥩 축산/계란',
    title: '국내산 한우·삼겹살\n당일 직송',
    subtitle: '냉장 상태 그대로 오늘 주문, 오늘 배송',
    cta: '축산물 보기',
    href: '/category/meat',
    imgSrc: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&h=420&q=80',
    badgeColor: '#dc2626',
  },
  {
    id: 4,
    bg: '#e0f0f8',
    badge: '🐟 수산/건어물',
    title: '싱싱한 수산물\n산지 당일 직송',
    subtitle: '오전 주문 시 당일 오후 배송 보장',
    cta: '수산물 보기',
    href: '/category/seafood',
    imgSrc: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&h=420&q=80',
    badgeColor: '#0284c7',
  },
  {
    id: 5,
    bg: '#e8f5e9',
    badge: '🌾 쌀/잡곡',
    title: '햇쌀·잡곡\n대용량 특가',
    subtitle: '충남 당진 농협 직송 햇쌀, 지금 특가 중',
    cta: '쌀/잡곡 보기',
    href: '/category/grain',
    imgSrc: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&h=420&q=80',
    badgeColor: '#16a34a',
  },
  {
    id: 6,
    bg: '#f0ebff',
    badge: '🎉 첫 구매 혜택',
    title: '첫 주문 고객에게\n5,000원 쿠폰 증정',
    subtitle: '필마트 가입 후 첫 구매 시 자동 적용',
    cta: '쿠폰 받기',
    href: '/auth',
    imgSrc: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&h=420&q=80',
    badgeColor: '#7c3aed',
  },
];

const SLIDE_W = 1280;
const AUTOPLAY_MS = 3800;
const SLIDE_H = 410;

export function HeroBanner() {
  const total = SLIDES.length;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [trackOffset, setTrackOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute pixel offset so the active slide is centered
  const computeOffset = useCallback((idx: number, containerW: number) => {
    const sw = Math.min(SLIDE_W, containerW);
    const peek = (containerW - sw) / 2; // space on each side
    return -(idx * sw) + peek;
  }, []);

  // Update offset whenever current or container width changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setTrackOffset(computeOffset(current, el.offsetWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [current, computeOffset]);

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing) timerRef.current = setInterval(next, AUTOPLAY_MS);
  }, [playing, next]);

  useEffect(() => {
    if (!playing) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, next]);

  const handlePrev = () => { prev(); resetTimer(); };
  const handleNext = () => { next(); resetTimer(); };

  // Pixel width of one slide (capped to container width on small screens)
  const containerW = containerRef.current?.offsetWidth ?? SLIDE_W;
  const slideW = Math.min(SLIDE_W, containerW);
  const peek = (containerW - slideW) / 2; // px showing on each side

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden relative select-none"
      style={{ backgroundColor: '#f3f4f6', height: SLIDE_H }}
    >
      {/* Track */}
      <div
        className="flex h-full absolute top-0"
        style={{
          width: total * slideW,
          transform: `translateX(${trackOffset}px)`,
          transition: 'transform 300ms ease-in-out',
        }}
      >
        {SLIDES.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className="flex-shrink-0 relative overflow-hidden block"
            style={{ width: slideW, height: SLIDE_H, backgroundColor: s.bg }}
          >
            {/* Food image (right side) */}
            <img
              src={s.imgSrc}
              alt=""
              draggable={false}
              className="absolute right-0 top-0 h-full object-cover pointer-events-none"
              style={{ width: '58%' }}
            />
            {/* Gradient: solid bg on left → transparent on right */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to right, ${s.bg} 40%, ${s.bg}dd 50%, ${s.bg}55 62%, transparent 76%)`,
              }}
            />
            {/* Text */}
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center pl-12 pr-4 z-10" style={{ width: '55%' }}>
              <span
                className="inline-block text-xs font-extrabold text-white px-3 py-1 rounded-full w-fit mb-4"
                style={{ backgroundColor: s.badgeColor }}
              >
                {s.badge}
              </span>
              <h2 className="text-[2rem] font-extrabold leading-snug mb-3 whitespace-pre-line text-gray-900">
                {s.title}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{s.subtitle}</p>
              <span
                className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-5 py-2.5 rounded-full w-fit hover:opacity-90 transition-opacity"
                style={{ backgroundColor: s.badgeColor }}
              >
                {s.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Left dim overlay (peek area) — click = prev */}
      {peek > 0 && (
        <div
          className="absolute inset-y-0 left-0 z-20 cursor-pointer"
          style={{ width: peek, background: 'rgba(255,255,255,0.38)' }}
          onClick={handlePrev}
        />
      )}
      {/* Right dim overlay (peek area) — click = next */}
      {peek > 0 && (
        <div
          className="absolute inset-y-0 right-0 z-20 cursor-pointer"
          style={{ width: peek, background: 'rgba(255,255,255,0.38)' }}
          onClick={handleNext}
        />
      )}

      {/* Left arrow */}
      <button
        onClick={handlePrev}
        className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-white/75 hover:bg-white shadow-md transition-colors"
        style={{ left: peek + 16 }}
        aria-label="이전"
      >
        <ChevronLeft className="h-4 w-4 text-gray-700" />
      </button>

      {/* Right arrow */}
      <button
        onClick={handleNext}
        className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-white/75 hover:bg-white shadow-md transition-colors"
        style={{ right: peek + 16 }}
        aria-label="다음"
      >
        <ChevronRight className="h-4 w-4 text-gray-700" />
      </button>

      {/* Bottom-left counter pill: || N/6 [icon] */}
      <div
        className="absolute bottom-6 z-30 flex items-center gap-2 bg-black/40 text-white text-xs px-4 py-1.5 rounded-full"
        style={{ left: peek + 28 }}
      >
        <button
          onClick={() => setPlaying(p => !p)}
          className="hover:opacity-80 transition-opacity"
          aria-label={playing ? '정지' : '재생'}
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <span className="font-semibold tracking-wide">{current + 1}/{total}</span>
        <Link href="/?cat=이번주특가" className="hover:opacity-80 transition-opacity" aria-label="더보기">
          <Maximize2 className="h-3 w-3" />
        </Link>
      </div>

      {/* Bottom-right dot indicators */}
      <div
        className="absolute bottom-6 z-30 flex items-center gap-1.5"
        style={{ right: peek + 28 }}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer(); }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              backgroundColor: i === current ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
            }}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
