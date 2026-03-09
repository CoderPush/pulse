'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CircleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getWeekDates } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { WeekSelector } from './WeekSelector';
import {
  PROJECT_CHECKIN_LAYER_LABELS,
  PROJECT_CHECKIN_LAYER_STYLES,
  PROJECT_CHECKIN_PAYLOAD_VERSION,
  SCORE_COLORS,
} from '@/lib/project-checkins/constants';
import type {
  ProjectCheckinLayer,
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricFormValue,
  ProjectCheckinMetricKey,
  ProjectCheckinMetricResponse,
  ProjectCheckinScaleGuide,
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

function getNotePlaceholder(definition: ProjectCheckinMetricDefinition, score: number): string {
  if (definition.always_comment) return 'What did the team learn this week? (required)';
  if (score <= 2) return "What's the main issue? (recommended)";
  if (score >= 4) return "What's going well? Worth sharing? (recommended)";
  return 'Add context (optional)';
}

/* ─── Benchmark Tooltip ───────────────────────────────────────── */

function BenchmarkTooltip({
  definition,
  position,
  onClose,
}: {
  definition: ProjectCheckinMetricDefinition;
  position: { top: number; left: number };
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 w-[360px] max-h-[400px] overflow-y-auto rounded-xl shadow-2xl"
      style={{
        top: Math.min(position.top, typeof window !== 'undefined' ? window.innerHeight - 420 : position.top),
        left: Math.min(position.left, typeof window !== 'undefined' ? window.innerWidth - 380 : position.left),
        background: '#1e1e2e',
        color: '#cdd6f4',
        fontSize: 13,
        lineHeight: 1.5,
        padding: '16px 18px',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: '#cba6f7' }}>
          {definition.name} — Guide
        </span>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer border-none bg-transparent p-0 text-lg"
          style={{ color: '#6c7086' }}
        >
          ×
        </button>
      </div>
      {definition.scale_guide.map((item) => {
        const sc = SCORE_COLORS[item.score];
        if (!sc) return null;
        return (
          <div
            key={item.score}
            className="mb-2.5 rounded-lg p-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderLeft: `3px solid ${sc.fill}`,
            }}
          >
            <div className="mb-0.5 flex items-center gap-2">
              <span
                className="w-[18px] text-center text-[15px] font-extrabold"
                style={{ color: sc.fill }}
              >
                {item.score}
              </span>
              <span className="text-[13px] font-bold" style={{ color: '#e0e0e0' }}>
                {item.label}
              </span>
            </div>
            <div className="pl-[26px] text-xs" style={{ color: '#a6adc8' }}>
              {item.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Score Button ────────────────────────────────────────────── */

function ScoreButton({
  score,
  selected,
  onClick,
  guide,
  disabled,
}: {
  score: number;
  selected: number | null;
  onClick: () => void;
  guide: ProjectCheckinScaleGuide;
  disabled: boolean;
}) {
  const sc = SCORE_COLORS[score];
  if (!sc) return null;
  const isSelected = selected === score;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${guide.label}: ${guide.shortLabel}`}
      className={cn(
        'flex h-[52px] w-[52px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] transition-all duration-200',
        disabled && 'cursor-not-allowed opacity-60',
      )}
      style={{
        border: `2px solid ${isSelected ? sc.fill : 'rgba(200,200,210,0.25)'}`,
        background: isSelected ? sc.bg : 'rgba(255,255,255,0.6)',
        boxShadow: isSelected ? `0 2px 12px ${sc.fill}30` : 'none',
        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <span
        className="text-[17px] font-extrabold leading-none"
        style={{ color: isSelected ? sc.fill : '#94a3b8' }}
      >
        {score}
      </span>
      <span
        className="text-[8px] font-semibold leading-none tracking-tight"
        style={{ color: isSelected ? sc.text : '#b0b8c8' }}
      >
        {guide.label}
      </span>
    </button>
  );
}

/* ─── Tag Selector ────────────────────────────────────────────── */

function TagSelector({
  tags,
  selected,
  onToggle,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const isActive = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className="cursor-pointer rounded-md px-2.5 py-1 text-[11px] transition-all duration-150"
            style={{
              border: `1.5px solid ${isActive ? '#818cf8' : 'rgba(200,200,210,0.3)'}`,
              background: isActive ? '#eef2ff' : 'rgba(255,255,255,0.5)',
              color: isActive ? '#4f46e5' : '#64748b',
              fontWeight: isActive ? 700 : 500,
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Note Input ──────────────────────────────────────────────── */

function NoteInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="box-border w-full resize-y rounded-lg px-3 py-2.5 text-[13px] text-slate-700 outline-none transition-colors duration-200"
      style={{
        border: '1.5px solid rgba(200,200,210,0.3)',
        background: 'rgba(255,255,255,0.7)',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#818cf8';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(200,200,210,0.3)';
      }}
    />
  );
}

/* ─── Submitted View ──────────────────────────────────────────── */

function SubmittedView({
  project,
  weekLabel,
  definitions,
  metricValues,
  previousResponsesByMetric,
  onEdit,
}: {
  project: { id: string; name: string };
  weekLabel: string;
  definitions: ProjectCheckinMetricDefinition[];
  metricValues: Record<ProjectCheckinMetricKey, ProjectCheckinMetricFormValue>;
  previousResponsesByMetric: Partial<Record<ProjectCheckinMetricKey, ProjectCheckinMetricResponse>>;
  onEdit: () => void;
}) {
  const changes = definitions.filter((def) => {
    const score = metricValues[def.metric_key].score;
    const prev = previousResponsesByMetric[def.metric_key]?.score ?? null;
    return score !== null && prev !== null && score !== prev;
  });

  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-6 rounded-xl border-[1.5px] border-green-300 bg-green-50 px-5 py-4 text-center">
        <div className="mb-1 text-xl font-bold text-green-600">✓ Submitted</div>
        <div className="text-sm text-green-700">
          {project.name} — {weekLabel}
        </div>
      </div>

      <div
        className="mb-4 rounded-xl p-5"
        style={{ background: '#fff', border: '1.5px solid rgba(200,200,210,0.25)' }}
      >
        <div className="mb-1 grid grid-cols-[1fr_60px_70px] gap-0 border-b border-slate-100 pb-2 text-xs font-bold text-slate-400">
          <span>Metric</span>
          <span className="text-center">You</span>
          <span className="text-center">Δ Week</span>
        </div>
        {definitions.map((def) => {
          const value = metricValues[def.metric_key];
          const score = value.score;
          const prev = previousResponsesByMetric[def.metric_key]?.score ?? null;
          const delta = score !== null && prev !== null ? score - prev : null;

          return (
            <div
              key={def.metric_key}
              className="grid grid-cols-[1fr_60px_70px] items-center gap-0 border-b border-slate-50 py-2.5"
            >
              <span className="text-[13px] font-semibold text-slate-700">{def.name}</span>
              <span
                className="text-center text-base font-extrabold"
                style={{
                  color: value.isSkipped ? '#cbd5e1' : score ? SCORE_COLORS[score]?.fill : '#cbd5e1',
                }}
              >
                {value.isSkipped ? '—' : (score ?? '—')}
              </span>
              <span
                className="text-center text-[13px] font-bold"
                style={{
                  color:
                    delta === null ? '#94a3b8' : delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#94a3b8',
                }}
              >
                {delta === null
                  ? '—'
                  : delta > 0
                    ? `↑${delta}`
                    : delta < 0
                      ? `↓${Math.abs(delta)}`
                      : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {changes.length > 0 && (
        <div className="mb-4 rounded-[10px] border-[1.5px] border-yellow-300 bg-yellow-50 px-4 py-3 text-[13px]">
          <div className="mb-1.5 font-bold text-amber-700">📊 Notable changes</div>
          {changes.map((def) => {
            const score = metricValues[def.metric_key].score!;
            const prev = previousResponsesByMetric[def.metric_key]!.score!;
            const diff = score - prev;
            return (
              <div key={def.metric_key} className="mb-0.5 text-amber-800">
                {def.name}: {prev} → {score} ({diff > 0 ? '+' : ''}
                {diff})
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-indigo-200 bg-white py-3 text-sm font-bold text-indigo-600"
        >
          ← Edit Response
        </button>
        <Button asChild className="h-auto flex-1 rounded-[10px] py-3 text-sm font-bold">
          <Link href="/check-ins">Back to Check-ins →</Link>
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */

export default function ProjectCheckinSession({
  project,
  year,
  weekNumber,
  definitions,
  previousResponsesByMetric,
  currentSubmission,
  currentResponses,
}: ProjectCheckinSessionProps) {
  const [metricValues, setMetricValues] = useState<
    Record<ProjectCheckinMetricKey, ProjectCheckinMetricFormValue>
  >(buildInitialMetricValues({ definitions, currentResponses }));
  const [openNote, setOpenNote] = useState(currentSubmission?.open_note ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tooltipDefinition, setTooltipDefinition] =
    useState<ProjectCheckinMetricDefinition | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const filledCount = useMemo(() => {
    return definitions.filter((def) => {
      const value = metricValues[def.metric_key];
      return value.score !== null || value.isSkipped;
    }).length;
  }, [definitions, metricValues]);

  const allMetricsAnswered = definitions.every((def) => {
    const value = metricValues[def.metric_key];
    if (!value) return false;
    if (def.skippable && value.isSkipped) return true;
    return value.score !== null;
  });

  const handleScore = useCallback((metricKey: ProjectCheckinMetricKey, score: number) => {
    setMetricValues((current) => ({
      ...current,
      [metricKey]: { ...current[metricKey], score, isSkipped: false },
    }));
  }, []);

  const handleSkip = useCallback((metricKey: ProjectCheckinMetricKey) => {
    setMetricValues((current) => ({
      ...current,
      [metricKey]: { ...current[metricKey], isSkipped: true, score: null },
    }));
  }, []);

  const handleUndoSkip = useCallback((metricKey: ProjectCheckinMetricKey) => {
    setMetricValues((current) => ({
      ...current,
      [metricKey]: { ...current[metricKey], isSkipped: false },
    }));
  }, []);

  const handleTagToggle = useCallback((metricKey: ProjectCheckinMetricKey, tag: string) => {
    setMetricValues((current) => {
      const currentTags = current[metricKey].selectedTags;
      const selectedTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return { ...current, [metricKey]: { ...current[metricKey], selectedTags } };
    });
  }, []);

  const handleNoteChange = useCallback((metricKey: ProjectCheckinMetricKey, note: string) => {
    setMetricValues((current) => ({
      ...current,
      [metricKey]: { ...current[metricKey], note },
    }));
  }, []);

  const showTooltip = useCallback(
    (definition: ProjectCheckinMetricDefinition, event: React.MouseEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPos({ top: rect.bottom + 8, left: rect.left });
      setTooltipDefinition(definition);
    },
    [],
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
          metrics: definitions.map((def) => ({
            metricKey: def.metric_key,
            score: metricValues[def.metric_key].score,
            isSkipped: metricValues[def.metric_key].isSkipped,
            selectedTags: metricValues[def.metric_key].selectedTags,
            note: metricValues[def.metric_key].note,
          })),
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setSubmitError(result.error ?? 'Failed to submit project check-in');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong while submitting the project check-in.');
    } finally {
      setSubmitting(false);
    }
  }

  const weekDates = getWeekDates(weekNumber, year);

  if (submitted) {
    return (
      <SubmittedView
        project={project}
        weekLabel={weekDates.label}
        definitions={definitions}
        metricValues={metricValues}
        previousResponsesByMetric={previousResponsesByMetric}
        onEdit={() => setSubmitted(false)}
      />
    );
  }

  let currentLayer: ProjectCheckinLayer | null = null;

  return (
    <div className="relative mx-auto max-w-[600px]">
      {tooltipDefinition && (
        <BenchmarkTooltip
          definition={tooltipDefinition}
          position={tooltipPos}
          onClose={() => setTooltipDefinition(null)}
        />
      )}

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Weekly Check-in
          </div>
          <h1 className="mt-0.5 text-[22px] font-extrabold text-slate-800">{project.name}</h1>
          <div className="mt-0.5 text-[13px] text-slate-500">{weekDates.labelLong}</div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
          <div
            className="text-xl font-extrabold"
            style={{ color: filledCount === definitions.length ? '#16a34a' : '#6366f1' }}
          >
            {filledCount}/{definitions.length}
          </div>
          <div className="text-[10px] font-semibold text-slate-400">rated</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-5 flex items-center gap-2">
        <WeekSelector projectId={project.id} year={year} weekNumber={weekNumber} />
        <Button asChild variant="outline" size="sm">
          <Link href="/check-ins">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Link>
        </Button>
      </div>

      {/* Hint */}
      <div className="mb-6 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <span className="text-base">💡</span>
        <span>
          Tap a score to rate, then add context. Tap <strong>?</strong> for the benchmark guide.
        </span>
      </div>

      {/* Metrics grouped by layer */}
      {definitions.map((definition, idx) => {
        const showLayerHeader = definition.layer !== currentLayer;
        if (showLayerHeader) currentLayer = definition.layer;
        const ls = PROJECT_CHECKIN_LAYER_STYLES[definition.layer];
        const value = metricValues[definition.metric_key];
        const score = value.score;
        const prevScore = previousResponsesByMetric[definition.metric_key]?.score ?? null;
        const selectedGuide =
          score !== null ? definition.scale_guide.find((g) => g.score === score) : null;

        return (
          <div key={definition.metric_key}>
            {/* Layer header */}
            {showLayerHeader && (
              <div
                className="mb-3.5 flex items-center gap-2"
                style={{ marginTop: idx === 0 ? 0 : 28 }}
              >
                <span className="text-sm" style={{ color: ls.color }}>
                  {ls.icon}
                </span>
                <span
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: ls.color }}
                >
                  {PROJECT_CHECKIN_LAYER_LABELS[definition.layer]}
                </span>
                <div className="h-px flex-1" style={{ background: ls.border }} />
              </div>
            )}

            {/* Metric card */}
            <div
              className="mb-3 rounded-xl bg-white px-[18px] py-4 transition-all duration-200"
              style={{
                border: `1.5px solid ${
                  score !== null
                    ? SCORE_COLORS[score].border + '60'
                    : value.isSkipped
                      ? '#e2e8f0'
                      : 'rgba(200,200,210,0.25)'
                }`,
              }}
            >
              {/* Card header */}
              <div className="mb-1 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-slate-800">{definition.name}</span>
                    <button
                      type="button"
                      onClick={(e) => showTooltip(definition, e)}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-slate-300 bg-transparent p-0 text-[11px] font-bold text-slate-400"
                    >
                      ?
                    </button>
                    {definition.skippable && !value.isSkipped && (
                      <button
                        type="button"
                        onClick={() => handleSkip(definition.metric_key)}
                        className="cursor-pointer border-none bg-transparent text-[11px] text-slate-400"
                      >
                        Skip (non-technical)
                      </button>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{definition.prompt}</div>
                </div>
                {prevScore !== null && SCORE_COLORS[prevScore] && (
                  <div className="min-w-[50px] text-right">
                    <div className="text-[10px] font-semibold text-slate-400">Last wk</div>
                    <div
                      className="text-base font-extrabold"
                      style={{ color: SCORE_COLORS[prevScore].fill }}
                    >
                      {prevScore}
                    </div>
                  </div>
                )}
              </div>

              {/* Skipped state */}
              {value.isSkipped ? (
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-400">Skipped — not applicable</span>
                  <button
                    type="button"
                    onClick={() => handleUndoSkip(definition.metric_key)}
                    className="cursor-pointer border-none bg-transparent text-[11px] font-semibold text-indigo-500"
                  >
                    Undo
                  </button>
                </div>
              ) : (
                <>
                  {/* Score buttons */}
                  <div className="mt-2.5 flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const guide = definition.scale_guide.find((g) => g.score === s);
                      if (!guide) return null;
                      return (
                        <ScoreButton
                          key={s}
                          score={s}
                          selected={score}
                          onClick={() => handleScore(definition.metric_key, s)}
                          guide={guide}
                          disabled={submitting}
                        />
                      );
                    })}
                  </div>

                  {/* Selected benchmark description */}
                  {selectedGuide && score !== null && (
                    <div
                      className="mt-2.5 rounded-lg px-3 py-2 text-xs font-medium"
                      style={{
                        background: SCORE_COLORS[score].bg,
                        border: `1px solid ${SCORE_COLORS[score].border}40`,
                        color: SCORE_COLORS[score].text,
                      }}
                    >
                      <strong>{selectedGuide.label}</strong> — {selectedGuide.shortLabel}
                    </div>
                  )}

                  {/* Tags + Note (inline when scored) */}
                  {score !== null && (
                    <div className="mt-2.5">
                      {definition.tag_options.length > 0 && (
                        <TagSelector
                          tags={definition.tag_options}
                          selected={value.selectedTags}
                          onToggle={(tag) => handleTagToggle(definition.metric_key, tag)}
                        />
                      )}
                      <NoteInput
                        value={value.note}
                        onChange={(v) => handleNoteChange(definition.metric_key, v)}
                        placeholder={getNotePlaceholder(definition, score)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Anything else */}
      <div
        className="mb-5 mt-7 rounded-xl bg-white px-[18px] py-4"
        style={{ border: '1.5px solid rgba(200,200,210,0.25)' }}
      >
        <div className="mb-1 text-[15px] font-bold text-slate-800">Anything else?</div>
        <div className="mb-2.5 text-xs text-slate-500">
          Wins, risks, blockers, or things worth flagging.
        </div>
        <NoteInput
          value={openNote}
          onChange={setOpenNote}
          placeholder="Free text — anything the metrics don't capture..."
        />
      </div>

      {/* Error */}
      {submitError && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={submitCheckin}
        disabled={!allMetricsAnswered || submitting}
        className="mb-3 w-full rounded-xl border-none py-3.5 text-[15px] font-bold transition-all duration-200"
        style={{
          background: !allMetricsAnswered ? '#e2e8f0' : '#4f46e5',
          color: !allMetricsAnswered ? '#94a3b8' : '#fff',
          cursor: !allMetricsAnswered || submitting ? 'default' : 'pointer',
        }}
      >
        {submitting
          ? 'Submitting...'
          : !allMetricsAnswered
            ? `Rate all metrics to submit (${filledCount}/${definitions.length})`
            : 'Submit Check-in ✓'}
      </button>

      <div className="mb-6 text-center text-[11px] text-slate-400">
        Your responses are visible to the team
      </div>
    </div>
  );
}
