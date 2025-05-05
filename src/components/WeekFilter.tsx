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
import { getMostRecentThursdayWeek } from '@/lib/utils/time'

interface WeekFilterProps {
  weeks: { value: string; label: string; week_number: number; year: number }[];
}

export function WeekFilter({ weeks }: WeekFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentYear = new Date().getFullYear();
  const currentWeek = getMostRecentThursdayWeek();
  
  const defaultWeekValue = weeks.find(w => w.week_number === currentWeek && w.year === currentYear)?.value || 
    (weeks.length > 0 ? weeks[weeks.length - 1].value : '');
  
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
        <SelectContent>
          {weeks.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 