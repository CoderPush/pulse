import { useState } from "react";

export default function DailyPulseAIAssistant({ onParse }: { onParse: (tasks: any[]) => void }) {
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/parse-daily-tasks", {
        method: "POST",
        body: JSON.stringify({ text: input }),
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to parse tasks");
      const { tasks } = await res.json();
      onParse(tasks);
    } catch (e) {
      setError("Could not parse tasks. Please check your input or try again.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 shadow flex flex-col gap-4">
      <div className="font-extrabold text-2xl text-purple-800 mb-1 flex items-center gap-2">
        <span role="img" aria-label="sparkles">✨</span> AI Assistant
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-stretch">
        <textarea
          className="w-full border border-purple-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          rows={3}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={'e.g. Fixed login bug @project-alpha #bugfix 1.5h\nCode review for new feature @project-beta #feature 2 hours'}
        />
        <div className="flex flex-col justify-end items-end min-w-[120px]">
          <button
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-lg px-8 py-3 rounded-lg shadow transition disabled:opacity-60"
            onClick={handleParse}
            disabled={parsing}
            style={{ minWidth: 120 }}
          >
            {parsing ? "Parsing..." : "Parse"}
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 text-base font-semibold mt-2">{error}</div>}
      <div className="mt-2">
        <div className="font-bold text-purple-700 text-base mb-1">Examples:</div>
        <div className="text-purple-900 text-base font-semibold leading-relaxed space-y-1">
          <div>"Fixed login bug <span className='text-purple-600'>@project-alpha</span> <span className='text-purple-600'>#bugfix</span> <span className='text-purple-600'>1.5h</span>"</div>
          <div>"Code review for new feature <span className='text-purple-600'>@project-beta</span> <span className='text-purple-600'>#feature</span> <span className='text-purple-600'>2 hours</span>"</div>
        </div>
      </div>
    </div>
  );
}
