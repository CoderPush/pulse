'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addWeeks } from 'date-fns/addWeeks';
import { getISOWeek } from 'date-fns/getISOWeek';
import { getISOWeekYear } from 'date-fns/getISOWeekYear';
import { startOfISOWeek } from 'date-fns/startOfISOWeek';
import { Calendar, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getWeekDates } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

const WEEKS_PAST = 14;
const WEEKS_FUTURE = 2;

function buildWeekOptions(): { year: number; weekNumber: number; label: string; labelShort: string }[] {
  const today = new Date();
  const start = startOfISOWeek(today);
  const seen = new Set<string>();
  const options: { year: number; weekNumber: number; label: string; labelShort: string }[] = [];

  for (let i = -WEEKS_PAST; i <= WEEKS_FUTURE; i++) {
    const weekStart = addWeeks(start, i);
    const y = getISOWeekYear(weekStart);
    const w = getISOWeek(weekStart);
    const key = `${y}-${w}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { label, labelLong } = getWeekDates(w, y);
    options.push({ year: y, weekNumber: w, label: labelLong, labelShort: label });
  }

  return options.reverse();
}

const WEEK_OPTIONS = buildWeekOptions();

const DEFAULT_WEEK = (() => {
  const now = new Date();
  return { year: getISOWeekYear(now), weekNumber: getISOWeek(now) };
})();

type NewCheckinFormProps = {
  projects: { id: string; name: string }[];
};

export default function NewCheckinForm({ projects }: NewCheckinFormProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [week, setWeek] = useState(DEFAULT_WEEK);
  const [weekPopoverOpen, setWeekPopoverOpen] = useState(false);

  const weekLabel = getWeekDates(week.weekNumber, week.year).label;

  function handleContinue() {
    if (!projectId) return;
    router.push(`/check-ins/${projectId}?year=${week.year}&week=${week.weekNumber}`);
  }

  if (!projects.length) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-6 text-sm text-slate-600">
          No projects are available for check-in. Contact your admin to add active projects.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">New check-in</CardTitle>
        <CardDescription>
          Choose a project and the week you want to check in for. You can submit multiple check-ins for different weeks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="project" className="text-sm font-medium text-slate-700">
            Project
          </label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="project" className="w-full">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Week</label>
          <Popover open={weekPopoverOpen} onOpenChange={setWeekPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  {weekLabel}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <div className="max-h-[280px] overflow-auto py-1">
                {WEEK_OPTIONS.map((opt) => {
                  const isSelected = opt.year === week.year && opt.weekNumber === week.weekNumber;
                  return (
                    <button
                      key={`${opt.year}-${opt.weekNumber}`}
                      type="button"
                      onClick={() => {
                        setWeek({ year: opt.year, weekNumber: opt.weekNumber });
                        setWeekPopoverOpen(false);
                      }}
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
        </div>

        <Button onClick={handleContinue} disabled={!projectId} className="w-full sm:w-auto">
          Continue to check-in form
        </Button>
      </CardContent>
    </Card>
  );
}
