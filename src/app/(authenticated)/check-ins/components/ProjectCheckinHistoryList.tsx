import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getWeekDates } from '@/lib/utils/date';
import { PROJECT_CHECKIN_LAYER_STYLES, SCORE_COLORS } from '@/lib/project-checkins/constants';
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
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            No check-ins yet
          </CardTitle>
          <CardDescription className="text-[13px] text-slate-600">
            Start a new check-in for any project and week. Your history will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-lg bg-indigo-600 font-semibold">
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
                  <CardTitle className="text-[15px] font-semibold text-slate-900">
                    {entry.project.name}
                  </CardTitle>
                  <CardDescription className="mt-1 text-[13px] text-slate-600">
                    {weekDates.label}
                  </CardDescription>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {entry.year}-W{entry.weekNumber.toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Submitted {formatDate(entry.submission.submitted_at)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {orderedResponses.map((response) => {
                  const definition = definitionMap.get(response.metric_key);
                  const layerStyle = definition
                    ? PROJECT_CHECKIN_LAYER_STYLES[definition.layer]
                    : undefined;
                  const score = response.is_skipped ? null : response.score;
                  const scoreColors =
                    score != null
                      ? (SCORE_COLORS[score as 1 | 2 | 3 | 4 | 5] as
                          | (typeof SCORE_COLORS)[1]
                          | undefined)
                      : undefined;

                  return (
                    <div
                      key={response.id}
                      className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="text-[13px] font-semibold leading-snug"
                            style={{ color: layerStyle?.color ?? '#0f172a' }}
                          >
                            {definition?.name ?? response.metric_key}
                          </div>
                          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            {layerStyle?.icon}{' '}
                            {definition?.layer
                              ? definition.layer.charAt(0).toUpperCase() +
                                definition.layer.slice(1)
                              : 'Metric'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="rounded-md px-2 py-1 text-xs font-extrabold"
                            style={{
                              background: scoreColors?.bg ?? 'transparent',
                              color: scoreColors?.text ?? '#94a3b8',
                              border: scoreColors
                                ? `1px solid ${scoreColors.border}`
                                : '1px solid rgba(148,163,184,0.4)',
                            }}
                          >
                            {response.is_skipped ? 'Skipped' : score ?? '—'}
                          </div>
                          {response.delta != null && response.delta !== 0 && (
                            <div
                              className="mt-0.5 text-[10px] font-semibold"
                              style={{
                                color:
                                  response.delta > 0 ? '#16a34a' : '#dc2626',
                              }}
                            >
                              {response.delta > 0
                                ? `↑${response.delta}`
                                : `↓${Math.abs(response.delta)}`}
                            </div>
                          )}
                        </div>
                      </div>
                      {response.note ? (
                        <p className="mt-1.5 text-[12px] leading-snug text-slate-700">
                          {response.note}
                        </p>
                      ) : null}
                      {response.selected_tags.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {response.selected_tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
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
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-[12px] text-slate-700">
                  <div className="mb-1 text-[12px] font-semibold text-slate-900">
                    Open note
                  </div>
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
