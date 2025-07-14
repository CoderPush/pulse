
import React, { useEffect, useState } from "react";
import { RefreshCw } from 'lucide-react';

type Task = {
  date?: string | null;
  project?: string | null;
  bucket?: string | null;
  hours?: string | null;
  description?: string | null;
};

interface ReviewTabProps {
  tasks: Task[];
}

const ReviewTab: React.FC<ReviewTabProps> = ({ tasks }) => {
  const [summary, setSummary] = useState<{
    keyAccomplishments?: string;
    whatMatteredMost?: string;
    lessonsAndNextFocus?: string;
    summary?: string; // fallback for old format
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current week key for localStorage
  function getCurrentWeekKey() {
    if (!tasks || tasks.length === 0) return "";
    // Use the first task's date to determine week (all tasks are filtered by week)
    const date = tasks[0].date;
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const dayOfYear = ((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1;
    const week = Math.ceil((dayOfYear + jan4.getDay() - 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setSummary(null);
      return;
    }
    const weekKey = getCurrentWeekKey();
    if (!weekKey) {
      setSummary(null);
      return;
    }
    const localKey = `ai-weekly-insight-${weekKey}`;
    const cached = !loading && typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
    if (cached) {
      try {
        setSummary(JSON.parse(cached));
      } catch {
        setSummary({ summary: cached });
      }
      return;
    }
    setLoading(true);
    setError(null);
    fetch("/api/ai-weekly-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("AI summary failed");
        const data = await res.json();
        setSummary(data);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(localKey, JSON.stringify(data));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tasks, loading]);

  // Add refresh handler
  const handleRefresh = () => {
    const weekKey = getCurrentWeekKey();
    if (!weekKey) return;
    const localKey = `ai-weekly-insight-${weekKey}`;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(localKey);
    }
    setLoading(true);
    setSummary(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">✨ Weekly Insights</h2>
        <button
          className={`ml-2 p-2 rounded-full border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors ${loading ? 'animate-spin pointer-events-none opacity-60' : ''}`}
          onClick={handleRefresh}
          aria-label="Refresh insights"
          disabled={loading}
          type="button"
        >
          <RefreshCw className="w-5 h-5 text-blue-700" />
        </button>
      </div>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 min-h-[80px]">
        {loading ? (
          <div className="text-blue-700">Generating summary...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : summary ? (
          <div className="space-y-6">
            {summary.keyAccomplishments && (
              <div>
                <div className="font-semibold text-blue-900 mb-1 flex items-center">
                  <span role="img" aria-label="trophy" className="mr-2">🏆</span> Key Accomplishments
                </div>
                <ul className="text-sm text-gray-800 bg-white rounded p-3 border border-blue-100 list-disc pl-5">
                  {summary.keyAccomplishments.split(/(?<=[.!?])\s+/).filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.whatMatteredMost && (
              <div>
                <div className="font-semibold text-blue-900 mb-1 flex items-center">
                  <span role="img" aria-label="target" className="mr-2">🎯</span> What Mattered Most
                </div>
                <ul className="text-sm text-gray-800 bg-white rounded p-3 border border-blue-100 list-disc pl-5">
                  {summary.whatMatteredMost.split(/(?<=[.!?])\s+/).filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.lessonsAndNextFocus && (
              <div>
                <div className="font-semibold text-blue-900 mb-1 flex items-center">
                  <span role="img" aria-label="bulb" className="mr-2">💡</span> Lessons & Next Focus
                </div>
                <ul className="text-sm text-gray-800 bg-white rounded p-3 border border-blue-100 list-disc pl-5">
                  {summary.lessonsAndNextFocus.split(/(?<=[.!?])\s+/).filter(Boolean).map((item, idx) => (
                    <li key={idx}>{item.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Fallback for old summary string */}
            {!summary.keyAccomplishments && summary.summary && (
              <div className="text-sm text-gray-700 whitespace-pre-line">{summary.summary}</div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">No tasks for this week.</div>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2 mt-6">Weekly Reflection</h3>
      <div className="mb-4">
        <div className="font-medium mb-1">⭐ What were your most impactful tasks this week?</div>
        <textarea className="w-full border rounded p-2" rows={2} placeholder="Describe the tasks that made the biggest difference..." />
      </div>
      <div className="mb-4">
        <div className="font-medium mb-1">🎯 How did your work align with high-impact goals?</div>
        <textarea className="w-full border rounded p-2" rows={2} placeholder="Describe alignment with team/company goals..." />
      </div>
      <div className="mb-4">
        <div className="font-medium mb-1">🚧 What blockers did you encounter?</div>
        <textarea className="w-full border rounded p-2" rows={2} placeholder="Describe any blockers or challenges..." />
      </div>
      <div className="mb-6">
        <div className="font-medium mb-1">🔁 What recurring tasks could be automated?</div>
        <textarea className="w-full border rounded p-2" rows={2} placeholder="List any repetitive work for automation..." />
      </div>

      <h3 className="text-lg font-semibold mb-2 mt-8">Manager Actions</h3>
      <ul className="mb-4 text-sm text-gray-700 list-disc pl-5">
        <li>Mark high-impact tasks</li>
        <li>Add comments to team member reflections</li>
        <li>Provide team feedback</li>
      </ul>
      
    </div>
  );
};

export default ReviewTab;
