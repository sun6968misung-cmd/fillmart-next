'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, Maximize2 } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    bgVar: 'var(--slide-veggie-bg)',
    badgeVar: 'var(--slide-veggie-badge)',
    badge: '🥬 이번주특가',
    title: '신선한 야채·과일을\n농가에서 직송',
    subtitle: '산지 직거래로 더 신선하게, 더 저렴하게',
    cta: '특가 보기',
    href: '/category/vegetables',
    imgSrc: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&h=420&q=80',
  },
  {
    id: 2,
    bgVar: 'var(--slide-sauce-bg)',
    badgeVar: 'var(--slide-sauce-badge)',
    badge: '🌶️ 양념/소스 특가',
    title: '가게·업소용\n소스·양념 한정 할인',
    subtitle: '고추장·된장·간장부터 업소용 대용량까지',
    cta: '지금 보기',
    href: '/category/sauce',
    imgSrc: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&h=420&q=80',
  },
  {
    id: 3,
    bgVar: 'var(--slide-meat-bg)',
    badgeVar: 'var(--slide-meat-badge)',
    badge: '🥩 축산/계란',
    title: '국내산 한우·삼겹살\n당일 직송',
    subtitle: '냉장 상태 그대로 오늘 주문, 오늘 배송',
    cta: '축산물 보기',
    href: '/category/meat',
    imgSrc: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&h=420&q=80',
  },
  {
    id: 4,
    bgVar: 'var(--slide-seafood-bg)',
    badgeVar: 'var(--slide-seafood-badge)',
    badge: '🐟 수산/건어물',
    title: '싱싱한 수산물\n산지 당일 직송',
    subtitle: '오전 주문 시 당일 오후 배송 보장',
    cta: '수산물 보기',
    href: '/category/seafood',
    imgSrc: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&h=420&q=80',
  },
  {
    id: 5,
    bgVar: 'var(--slide-grain-bg)',
    badgeVar: 'var(--slide-grain-badge)',
    badge: '🌾 쌀/잡곡',
    title: '햇쌀·잡곡\n대용량 특가',
    subtitle: '충남 당진 농협 직송 햇쌀, 지금 특가 중',
    cta: '쌀/잡곡 보기',
    href: '/category/grain',
    imgSrc: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&h=420&q=80',
  },
  {
    id: 6,
    bgVar: 'var(--slide-promo-bg)',
    badgeVar: 'var(--slide-promo-badge)',
    badge: '🎉 첫 구매 혜택',
    title: '첫 주문 고객에게\n5,000원 쿠폰 증정',
    subtitle: '필마트 가입 후 첫 구매 시 자동 적용',
    cta: '쿠폰 받기',
    href: '/auth',
    imgSrc: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&h=420&q=80',
  },
];

const SLIDE_W = 1280;
const AUTOPLAY_MS = 3800;
const SLIDE_H = 410;

export function HeroBanner() {
  const total = SLIDES.length;
  // [clone-of-last, ...real slides, clone-of-first]
  const extended = [SLIDES[total - 1], ...SLIDES, SLIDES[0]];

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [containerW, setContainerW] = useState(SLIDE_W);

  // trackIdx: position inside `extended` array. Real slides live at 1..total.
  const [trackIdx, setTrackIdx] = useState(1);
  const [animated, setAnimated] = useState(true);
  const [playing, setPlaying] = useState(true);

  // display index (0-based, for dots and counter)
  const displayIdx = ((trackIdx - 1) % total + total) % total;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerW(el.offsetWidth);
    const ro = new ResizeObserver(() => setContainerW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slideW = Math.min(SLIDE_W, containerW);
  const peek = (containerW - slideW) / 2;
  const trackOffset = -(trackIdx * slideW) + peek;

  const next = useCallback(() => setTrackIdx(t => t + 1), []);
  const prev = useCallback(() => setTrackIdx(t => t - 1), []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing) timerRef.current = setInterval(next, AUTOPLAY_MS);
  }, [playing, next]);

  useEffect(() => {
    if (!playing) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, next]);

  // 백그라운드 탭에서 setInterval이 throttle되는 문제 방지
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      } else if (playing) {
        timerRef.current = setInterval(next, AUTOPLAY_MS);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [playing, next]);

  // After the CSS transition ends, silently jump from clone to real slide.
  const handleTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    // 자식 요소(버튼 hover 등)의 transition bubble 무시 — track 자체의 transform만 처리
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    if (trackIdx === 0) {
      setAnimated(false);
      setTrackIdx(total);
    } else if (trackIdx === total + 1) {
      setAnimated(false);
      setTrackIdx(1);
    }
  }, [trackIdx, total]);

  // Re-enable animation after the silent positional jump.
  useEffect(() => {
    if (!animated) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
      return () => cancelAnimationFrame(id);
    }
  }, [animated]);

  const handlePrev = () => { setAnimated(true); prev(); resetTimer(); };
  const handleNext = () => { setAnimated(true); next(); resetTimer(); };
  const handleDot = (di: number) => { setAnimated(true); setTrackIdx(di + 1); resetTimer(); };

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden relative select-none bg-muted"
      style={{ height: SLIDE_H }}
    >
      {/* Track */}
      <div
        className="flex h-full absolute top-0"
        style={{
          width: extended.length * slideW,
          transform: `translateX(${trackOffset}px)`,
          transition: animated ? 'transform 300ms ease-in-out' : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extended.map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className="flex-shrink-0 relative overflow-hidden block"
            style={{
              width: slideW,
              height: SLIDE_H,
              backgroundColor: s.bgVar,
              ['--slide-bg' as string]: s.bgVar,
            }}
          >
            <img
              src={s.imgSrc}
              alt={`${s.badge} — ${s.title.replace(/\n/g, ' ')}`}
              draggable={false}
              className="absolute right-0 top-0 h-full object-cover pointer-events-none"
              style={{ width: '58%' }}
            />
            <div className="slide-gradient-overlay absolute inset-0 pointer-events-none" />
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center pl-12 pr-4 z-10" style={{ width: '55%' }}>
              <span
                className="inline-block text-xs font-extrabold text-white px-3 py-1 rounded-full w-fit mb-4"
                style={{ backgroundColor: s.badgeVar }}
              >
                {s.badge}
              </span>
              <h2 className="text-[2rem] font-extrabold leading-snug mb-3 whitespace-pre-line text-gray-900">
                {s.title}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{s.subtitle}</p>
              <span
                className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-5 py-2.5 rounded-full w-fit hover:opacity-90 transition-opacity"
                style={{ backgroundColor: s.badgeVar }}
              >
                {s.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Left dim overlay (peek area) */}
      {peek > 0 && (
        <div
          className="absolute inset-y-0 left-0 z-20 cursor-pointer"
          style={{ width: peek, background: 'rgba(255,255,255,0.38)' }}
          onClick={handlePrev}
        />
      )}
      {/* Right dim overlay (peek area) */}
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
        className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-white/75 hover:bg-white shadow-md transition-colors"
        style={{ left: peek + 16 }}
        aria-label="이전"
      >
        <ChevronLeft className="h-4 w-4 text-gray-700" />
      </button>

      {/* Right arrow */}
      <button
        onClick={handleNext}
        className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-white/75 hover:bg-white shadow-md transition-colors"
        style={{ right: peek + 16 }}
        aria-label="다음"
      >
        <ChevronRight className="h-4 w-4 text-gray-700" />
      </button>

      {/* Bottom-left counter pill */}
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
        <span className="font-semibold tracking-wide">{displayIdx + 1}/{total}</span>
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
            onClick={() => handleDot(i)}
            className="inline-flex items-center justify-center min-h-11 min-w-[22px]"
            aria-label={`슬라이드 ${i + 1}`}
          >
            <span
              className="rounded-full transition-all duration-300 block"
              style={{
                width: i === displayIdx ? 16 : 6,
                height: 6,
                backgroundColor: i === displayIdx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
