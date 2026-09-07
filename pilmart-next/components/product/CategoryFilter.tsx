'use client';

const CATEGORIES = [
  { value: '전체',          emoji: '🛍️', bg: 'bg-gray-100',   label: '전체' },
  { value: '이번주특가',    emoji: '🏷️', bg: 'bg-red-50',    label: '이번주특가' },
  { value: '야채/채소',     emoji: '🥬', bg: 'bg-green-50',   label: '야채/채소' },
  { value: '과일',          emoji: '🍎', bg: 'bg-orange-50',  label: '과일' },
  { value: '쌀/잡곡',      emoji: '🌾', bg: 'bg-yellow-50',  label: '쌀/잡곡' },
  { value: '축산/계란',     emoji: '🥩', bg: 'bg-red-50',    label: '축산/계란' },
  { value: '수산/건어물',   emoji: '🐟', bg: 'bg-blue-50',   label: '수산/건어물' },
  { value: '견과류',        emoji: '🥜', bg: 'bg-amber-50',  label: '견과류' },
  { value: '양념/소스/육수', emoji: '🌶️', bg: 'bg-red-50',   label: '양념/소스' },
  { value: '라면/면류',     emoji: '🍜', bg: 'bg-yellow-50', label: '라면/면류' },
  { value: '유제품/냉장/냉동', emoji: '🥛', bg: 'bg-sky-50', label: '유제품/냉장' },
  { value: '캔/통조림',     emoji: '🥫', bg: 'bg-gray-100',  label: '캔/통조림' },
  { value: '반찬/편의식',   emoji: '🍱', bg: 'bg-orange-50', label: '반찬/편의식' },
  { value: '음료/생수',     emoji: '🥤', bg: 'bg-cyan-50',   label: '음료/생수' },
  { value: '빵/스낵/과자', emoji: '🍪', bg: 'bg-pink-50',   label: '빵/스낵' },
];

interface CategoryFilterProps {
  value: string;
  onChange: (val: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-0 min-w-max">
        {CATEGORIES.map(cat => {
          const active = value === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onChange(cat.value)}
              className="flex flex-col items-center gap-1 px-3 py-2 min-w-[64px] focus:outline-none"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${cat.bg} ${active ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'}`}>
                {cat.emoji}
              </div>
              <span className={`text-[11px] whitespace-nowrap leading-tight ${active ? 'font-bold text-primary' : 'text-gray-600'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
