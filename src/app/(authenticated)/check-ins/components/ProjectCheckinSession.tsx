'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getWeekDates } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { WeekSelector } from './WeekSelector';
import {
  PROJECT_CHECKIN_LAYER_DESCRIPTIONS,
  PROJECT_CHECKIN_LAYER_LABELS,
  PROJECT_CHECKIN_PAYLOAD_VERSION,
} from '@/lib/project-checkins/constants';
import { shouldPromptForDetail } from '@/lib/project-checkins/scoring';
import type {
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricFormValue,
  ProjectCheckinMetricKey,
  ProjectCheckinMetricResponse,
  ProjectCheckinSubmission,
} from '@/types/project-checkin';

type ProjectCheckinSessionProps = {
  project: { id: string; name: string };
  year: number;
  weekNumber: number;
  definitions: ProjectCheckinMetricDefinition[];
  previousResponsesByMetric: Partial<Record<ProjectCheckinMetricKey, ProjectCheckinMetricResponse>>;
  currentSubmission: ProjectCheckinSubmission | null;
  currentResponses: ProjectCheckinMetricResponse[];
};

type SessionStep = 'rate' | 'details' | 'note';

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

function buildInitialMetricValues(args: {
  definitions: ProjectCheckinMetricDefinition[];
  currentResponses: ProjectCheckinMetricResponse[];
}): Record<ProjectCheckinMetricKey, ProjectCheckinMetricFormValue> {
  const responsesByMetric = Object.fromEntries(
    args.currentResponses.map((response) => [response.metric_key, response]),
  ) as Partial<Record<ProjectCheckinMetricKey, ProjectCheckinMetricResponse>>;

  return Object.fromEntries(
    args.definitions.map((definition) => {
      const response = responsesByMetric[definition.metric_key];
      return [
        definition.metric_key,
        {
          score: response?.score ?? null,
          isSkipped: response?.is_skipped ?? false,
          selectedTags: response?.selected_tags ?? [],
          note: response?.note ?? '',
        },
      ];
    }),
  ) as Record<ProjectCheckinMetricKey, ProjectCheckinMetricFormValue>;
}

function MetricGuide({ definition }: { definition: ProjectCheckinMetricDefinition }) {
  return (
    <details className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3 text-sm">
      <summary className="cursor-pointer font-medium text-slate-700">Benchmarks</summary>
      <div className="mt-3 space-y-2">
        {definition.scale_guide.map((item) => (
          <div key={item.score} className="rounded-md bg-white p-2">
            <div className="font-medium text-slate-900">
              {item.score}. {item.label}
            </div>
            <div className="text-slate-600">{item.shortLabel}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

function ScoreSelector({
  definition,
  value,
  previousScore,
  onScoreSelect,
  onSkipToggle,
  disabled,
}: {
  definition: ProjectCheckinMetricDefinition;
  value: ProjectCheckinMetricFormValue;
  previousScore: number | null;
  onScoreSelect: (score: number) => void;
  onSkipToggle: () => void;
  disabled: boolean;
}) {
  const selectedGuide = definition.scale_guide.find((item) => item.score === value.score);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{definition.name}</CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-600">
              {definition.prompt}
            </CardDescription>
          </div>
          <div className="text-sm text-slate-500">
            Last week: <span className="font-semibold text-slate-900">{previousScore ?? '-'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {SCORE_OPTIONS.map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => onScoreSelect(score)}
              disabled={disabled}
              className={cn(
                'rounded-lg border px-3 py-3 text-center text-sm font-semibold transition',
                value.score === score && !value.isSkipped
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <div>{score}</div>
              <div className="mt-1 text-xs font-normal">
                {definition.scale_guide.find((item) => item.score === score)?.label}
              </div>
            </button>
          ))}
        </div>

        {definition.skippable ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span>Skip if you do not have enough visibility for this metric.</span>
            <Button type="button" variant="outline" size="sm" onClick={onSkipToggle} disabled={disabled}>
              {value.isSkipped ? 'Undo skip' : 'Skip'}
            </Button>
          </div>
        ) : null}

        {value.isSkipped ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Skipped for this project check-in.
          </div>
        ) : selectedGuide ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <span className="font-semibold">{selectedGuide.label}:</span> {selectedGuide.shortLabel}
          </div>
        ) : null}

        <MetricGuide definition={definition} />
      </CardContent>
    </Card>
  );
}

export default function ProjectCheckinSession({
  project,
  year,
  weekNumber,
  definitions,
  previousResponsesByMetric,
  currentSubmission,
  currentResponses,
}: ProjectCheckinSessionProps) {
  const [step, setStep] = useState<SessionStep>('rate');
  const [metricValues, setMetricValues] = useState<Record<ProjectCheckinMetricKey, ProjectCheckinMetricFormValue>>(
    buildInitialMetricValues({ definitions, currentResponses }),
  );
  const [openNote, setOpenNote] = useState(currentSubmission?.open_note ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const groupedDefinitions = useMemo(() => {
    return definitions.reduce<Record<string, ProjectCheckinMetricDefinition[]>>((acc, definition) => {
      if (!acc[definition.layer]) acc[definition.layer] = [];
      acc[definition.layer].push(definition);
      return acc;
    }, {});
  }, [definitions]);

  const allMetricsAnswered = definitions.every((definition) => {
    const value = metricValues[definition.metric_key];
    if (!value) return false;
    if (definition.skippable && value.isSkipped) return true;
    return value.score !== null;
  });

  const promptedDefinitions = useMemo(
    () =>
      definitions.filter((definition) =>
        shouldPromptForDetail({
          definition,
          value: metricValues[definition.metric_key],
          previousScore: previousResponsesByMetric[definition.metric_key]?.score ?? null,
        }),
      ),
    [definitions, metricValues, previousResponsesByMetric],
  );

  async function submitCheckin() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/project-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          year,
          weekNumber,
          payloadVersion: PROJECT_CHECKIN_PAYLOAD_VERSION,
          openNote,
          metrics: definitions.map((definition) => ({
            metricKey: definition.metric_key,
            score: metricValues[definition.metric_key].score,
            isSkipped: metricValues[definition.metric_key].isSkipped,
            selectedTags: metricValues[definition.metric_key].selectedTags,
            note: metricValues[definition.metric_key].note,
          })),
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setSubmitError(result.error ?? 'Failed to submit project check-in');
        setSubmitting(false);
        return;
      }

      window.location.href = '/check-ins';
      return;
    } catch {
      setSubmitError('Something went wrong while submitting the project check-in.');
    } finally {
      setSubmitting(false);
    }
  }

  const weekDates = getWeekDates(weekNumber, year);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">Project metric check-in</div>
          <h1 className="mt-0.5 text-2xl font-semibold text-slate-950">{project.name}</h1>
          <p className="mt-1.5 text-sm text-slate-600" title={weekDates.labelLong}>
            {weekDates.labelLong}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {year}-W{weekNumber.toString().padStart(2, '0')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WeekSelector projectId={project.id} year={year} weekNumber={weekNumber} />
          <Button asChild variant="outline">
            <Link href="/check-ins">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to check-ins
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">
            {step === 'rate' ? 'Step 1 of 3: Rate metrics' : step === 'details' ? 'Step 2 of 3: Add context' : 'Step 3 of 3: Open note'}
          </CardTitle>
          <CardDescription>
            {step === 'rate'
              ? 'Rate all nine metrics for this project. Use skip only where the rubric explicitly allows it.'
              : step === 'details'
                ? 'Only the metrics that need extra context are shown here.'
                : 'Capture anything important that the metric rubric did not cover.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {step === 'rate' ? (
        <>
          {(['foundation', 'execution', 'outcome'] as const).map((layer) => {
            const layerDefinitions = groupedDefinitions[layer] ?? [];
            if (!layerDefinitions.length) return null;

            return (
              <section key={layer} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{PROJECT_CHECKIN_LAYER_LABELS[layer]}</h2>
                  <p className="text-sm text-slate-600">{PROJECT_CHECKIN_LAYER_DESCRIPTIONS[layer]}</p>
                </div>
                <div className="space-y-4">
                  {layerDefinitions.map((definition) => (
                    <ScoreSelector
                      key={definition.metric_key}
                      definition={definition}
                      value={metricValues[definition.metric_key]}
                      previousScore={previousResponsesByMetric[definition.metric_key]?.score ?? null}
                      disabled={submitting}
                      onScoreSelect={(score) =>
                        setMetricValues((current) => ({
                          ...current,
                          [definition.metric_key]: {
                            ...current[definition.metric_key],
                            score,
                            isSkipped: false,
                          },
                        }))
                      }
                      onSkipToggle={() =>
                        setMetricValues((current) => ({
                          ...current,
                          [definition.metric_key]: {
                            ...current[definition.metric_key],
                            isSkipped: !current[definition.metric_key].isSkipped,
                            score: current[definition.metric_key].isSkipped ? current[definition.metric_key].score : null,
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {allMetricsAnswered
                ? 'All required metrics have been rated.'
                : 'Rate every metric before continuing.'}
            </div>
            <Button
              onClick={() => setStep(promptedDefinitions.length > 0 ? 'details' : 'note')}
              disabled={!allMetricsAnswered || submitting}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : null}

      {step === 'details' ? (
        <>
          {promptedDefinitions.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-6 text-sm text-slate-600">
                No additional prompts were triggered for this project.
              </CardContent>
            </Card>
          ) : (
            promptedDefinitions.map((definition) => {
              const value = metricValues[definition.metric_key];
              const previousScore = previousResponsesByMetric[definition.metric_key]?.score ?? null;
              const currentScore = value.isSkipped ? null : value.score;

              return (
                <Card key={definition.metric_key} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{definition.name}</CardTitle>
                    <CardDescription>
                      Current: {currentScore ?? 'Skipped'} | Previous: {previousScore ?? '-'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {definition.tag_options.map((tag) => {
                        const selected = value.selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={cn(
                              'rounded-full border px-3 py-1 text-sm transition',
                              selected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                            )}
                            onClick={() =>
                              setMetricValues((current) => {
                                const currentTags = current[definition.metric_key].selectedTags;
                                const selectedTags = currentTags.includes(tag)
                                  ? currentTags.filter((item) => item !== tag)
                                  : [...currentTags, tag];

                                return {
                                  ...current,
                                  [definition.metric_key]: {
                                    ...current[definition.metric_key],
                                    selectedTags,
                                  },
                                };
                              })
                            }
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <Textarea
                      value={value.note}
                      onChange={(event) =>
                        setMetricValues((current) => ({
                          ...current,
                          [definition.metric_key]: {
                            ...current[definition.metric_key],
                            note: event.target.value,
                          },
                        }))
                      }
                      placeholder={
                        definition.always_comment
                          ? 'What did the team learn or improve this week?'
                          : 'Add a short note with the key context behind this score.'
                      }
                      rows={4}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep('rate')} disabled={submitting}>
              Back
            </Button>
            <Button onClick={() => setStep('note')} disabled={submitting}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : null}

      {step === 'note' ? (
        <>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Anything else to flag?</CardTitle>
              <CardDescription>
                Wins, blockers, or context that is useful for the next review conversation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={openNote}
                onChange={(event) => setOpenNote(event.target.value)}
                placeholder="Optional note"
                rows={5}
              />
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                The current module is intentionally separate from the weekly pulse form so both flows can run in
                parallel during rollout.
              </div>
            </CardContent>
          </Card>

          {submitError ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4" />
              <span>{submitError}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(promptedDefinitions.length > 0 ? 'details' : 'rate')} disabled={submitting}>
              Back
            </Button>
            <Button onClick={submitCheckin} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit project check-in'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
