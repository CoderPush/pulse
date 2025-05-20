'use client'

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getMostRecentThursdayWeek } from '@/lib/utils/date'

interface WeekFilterProps {
  weeks: { value: string; label: string; week_number: number; year: number }[];
}

export function WeekFilter({ weeks }: WeekFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentYear = new Date().getFullYear();
  const currentWeek = getMostRecentThursdayWeek();
  
  // Sort weeks descending (latest first)
  const sortedWeeks = [...weeks].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.week_number - a.week_number;
  });

  const defaultWeekValue = sortedWeeks.find(w => w.week_number === currentWeek && w.year === currentYear)?.value || 
    (sortedWeeks.length > 0 ? sortedWeeks[0].value : '');
  
  const currentWeekValue = searchParams.get('week') || defaultWeekValue;

  const handleWeekChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('week', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4 max-w-xs">
      <Select value={currentWeekValue} onValueChange={handleWeekChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by week" />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {sortedWeeks.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-100 focus:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-700"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 