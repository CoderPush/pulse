'use client';

import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown } from 'lucide-react';
import { addWeeks } from 'date-fns/addWeeks';
import { getISOWeek } from 'date-fns/getISOWeek';
import { getISOWeekYear } from 'date-fns/getISOWeekYear';
import { startOfISOWeek } from 'date-fns/startOfISOWeek';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getWeekDates } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

const WEEKS_PAST = 14;
const WEEKS_FUTURE = 2;

type WeekOption = { year: number; weekNumber: number; label: string; labelShort: string };

function buildWeekOptions(): WeekOption[] {
  const today = new Date();
  const start = startOfISOWeek(today);
  const seen = new Set<string>();
  const options: WeekOption[] = [];

  for (let i = -WEEKS_PAST; i <= WEEKS_FUTURE; i++) {
    const weekStart = addWeeks(start, i);
    const y = getISOWeekYear(weekStart);
    const w = getISOWeek(weekStart);
    const key = `${y}-${w}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { label, labelLong } = getWeekDates(w, y);
    options.push({
      year: y,
      weekNumber: w,
      label: labelLong,
      labelShort: label,
    });
  }

  return options.reverse();
}

const WEEK_OPTIONS = buildWeekOptions();

type WeekSelectorProps = {
  projectId: string;
  year: number;
  weekNumber: number;
  className?: string;
};

export function WeekSelector({ projectId, year, weekNumber, className }: WeekSelectorProps) {
  const router = useRouter();
  const current = getWeekDates(weekNumber, year);

  function selectWeek(y: number, w: number) {
    router.push(`/check-ins/${projectId}?year=${y}&week=${w}`);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'min-w-[200px] justify-between gap-2 font-normal text-slate-700',
            className,
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate text-left">
            {current.labelShort}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="end">
        <div className="max-h-[320px] overflow-auto py-1">
          <div className="px-2 py-1.5 text-xs font-medium text-slate-500">
            Select week
          </div>
          {WEEK_OPTIONS.map((opt) => {
            const isSelected = opt.year === year && opt.weekNumber === weekNumber;
            return (
              <button
                key={`${opt.year}-${opt.weekNumber}`}
                type="button"
                title={opt.label}
                onClick={() => selectWeek(opt.year, opt.weekNumber)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-100',
                  isSelected && 'bg-slate-100 font-medium text-slate-900',
                )}
              >
                <span className={cn('text-slate-700', isSelected && 'font-semibold')}>
                  {opt.year}-W{opt.weekNumber.toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500">{opt.labelShort}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
