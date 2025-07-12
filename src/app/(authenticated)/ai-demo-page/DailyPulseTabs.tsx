import React from "react";

interface DailyPulseTabsProps {
  tab: string;
  setTab: (tab: string) => void;
}

const tabList = [
  { key: "parse", label: "Parse Log" },
  { key: "dashboard", label: "Dashboard" },
  { key: "review", label: "Review" },
];

const DailyPulseTabs: React.FC<DailyPulseTabsProps> = ({ tab, setTab }) => (
  <div className="mb-6">
    <div className="flex gap-2">
      {tabList.map(t => (
        <button
          key={t.key}
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 ${tab === t.key ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-gray-500 bg-gray-100"}`}
          onClick={() => setTab(t.key)}
        >{t.label}</button>
      ))}
    </div>
  </div>
);

export default DailyPulseTabs;
