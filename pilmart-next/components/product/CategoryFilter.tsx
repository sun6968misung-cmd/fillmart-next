'use client';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const CATEGORIES = ['전체', '야채/채소', '과일', '축산/계란', '수산/건어물', '라면/면류', '유제품/냉장/냉동', '캔/통조림'];

interface CategoryFilterProps {
  value: string;
  onChange: (val: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <ToggleGroup
        value={value ? [value] : []}
        onValueChange={(vals: string[]) => onChange(vals[vals.length - 1] ?? '전체')}
        className="flex-nowrap"
      >
        {CATEGORIES.map(cat => (
          <ToggleGroupItem key={cat} value={cat} className="whitespace-nowrap text-xs px-3">
            {cat}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
