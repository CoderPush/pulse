import { Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function StreakCard({
  streak,
  allWeeks,
  submissions,
  currentWeek,
}: {
  streak: number;
  allWeeks: { week_number: number; year: number }[];
  submissions: { week_number: number; submitted_at: string }[];
  currentWeek: number;
}) {
  const submittedWeeks = new Set(submissions.map(s => s.week_number));
  return (
    <div className="mb-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 shadow flex flex-col items-center py-6 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-8 h-8 text-yellow-500 animate-bounce" />
          <span className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{streak}</span>
        </div>
        <div className="text-yellow-700 dark:text-yellow-300 font-semibold mb-2">Week Streak</div>
        <div className="flex gap-1 mb-2 overflow-x-auto max-w-full">
          {allWeeks.map((w) => {
            const isSubmitted = submittedWeeks.has(w.week_number);
            const isCurrent = w.week_number === currentWeek;
            const isFuture = w.week_number > currentWeek;

            let dotClass = '';
            let tooltip = '';
            if (isFuture) {
              dotClass = 'bg-white border-blue-300 border-2 dark:bg-transparent dark:border-blue-700';
              tooltip = 'Upcoming';
            } else if (isCurrent) {
              dotClass = isSubmitted
                ? 'bg-yellow-400 border-yellow-500'
                : 'bg-white border-blue-500 animate-pulse ring-2 ring-blue-300 dark:bg-transparent dark:border-blue-400';
              tooltip = isSubmitted ? 'This week: Submitted' : 'This week: Not submitted yet';
            } else {
              dotClass = isSubmitted
                ? 'bg-yellow-400 border-yellow-500'
                : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600';
              tooltip = isSubmitted ? 'Submitted' : 'Missed';
            }

            return (
              <Tooltip key={w.week_number}>
                <TooltipTrigger asChild>
                  <span className={`w-5 h-5 rounded-full ${dotClass} transition-all`} />
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="font-semibold">Week {w.week_number}</div>
                    <div>{tooltip}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          {streak > 2
            ? "You're on fire! Keep your streak alive 🔥"
            : streak > 0
            ? "Keep it up! Consistency is key."
            : "Start your streak! Submit this week."}
        </div>
      </div>
    </div>
  );
} 