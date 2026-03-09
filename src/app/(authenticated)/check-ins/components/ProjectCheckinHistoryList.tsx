import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getWeekDates } from '@/lib/utils/date';
import type {
  ProjectCheckinHistoryEntry,
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricKey,
} from '@/types/project-checkin';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ProjectCheckinHistoryList({
  entries,
  definitions,
}: {
  entries: ProjectCheckinHistoryEntry[];
  definitions: ProjectCheckinMetricDefinition[];
}) {
  const definitionMap = new Map<ProjectCheckinMetricKey, ProjectCheckinMetricDefinition>(
    definitions.map((definition) => [definition.metric_key, definition]),
  );

  if (!entries.length) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>No check-ins yet</CardTitle>
          <CardDescription>
            Start a new check-in for any project and week. Your history will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/check-ins/new">Start new check-in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const orderedResponses = [...entry.responses].sort((left, right) => {
          const leftOrder = definitionMap.get(left.metric_key)?.display_order ?? 999;
          const rightOrder = definitionMap.get(right.metric_key)?.display_order ?? 999;
          return leftOrder - rightOrder;
        });

        const weekDates = getWeekDates(entry.weekNumber, entry.year);

        return (
          <Card key={entry.submission.id} className="border-slate-200">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{entry.project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {weekDates.label}
                  </CardDescription>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.year}-W{entry.weekNumber.toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="text-sm text-slate-500">Submitted {formatDate(entry.submission.submitted_at)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {orderedResponses.map((response) => {
                  const definition = definitionMap.get(response.metric_key);
                  return (
                    <div key={response.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-slate-900">{definition?.name ?? response.metric_key}</div>
                        <div className="text-sm font-semibold text-slate-700">
                          {response.is_skipped ? 'Skipped' : response.score}
                        </div>
                      </div>
                      {response.note ? (
                        <p className="mt-2 text-sm text-slate-600">{response.note}</p>
                      ) : null}
                      {response.selected_tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {response.selected_tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {entry.submission.open_note ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="mb-1 font-medium text-slate-900">Open note</div>
                  {entry.submission.open_note}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
