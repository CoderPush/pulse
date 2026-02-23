import React from "react";
import { CalendarDays, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardFiltersProps {
  filterType: 'week' | 'month';
  setFilterType: (type: 'week' | 'month') => void;
  filterValue: string;
  setFilterValue: (val: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filterType, setFilterType, filterValue, setFilterValue }) => {
  // Format display label for the selected period
  const getDisplayLabel = () => {
    if (!filterValue) return "Select period";
    if (filterType === "month") {
      const [year, month] = filterValue.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      const [year, week] = filterValue.split("-W");
      return `Week ${parseInt(week)}, ${year}`;
    }
  };

  // Navigate to previous/next period
  const navigatePeriod = (direction: -1 | 1) => {
    if (!filterValue) return;
    
    if (filterType === "month") {
      const [year, month] = filterValue.split("-").map(Number);
      const newDate = new Date(year, month - 1 + direction);
      setFilterValue(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
    } else {
      const [year, weekStr] = filterValue.split("-W");
      const week = parseInt(weekStr) + direction;
      if (week < 1) {
        setFilterValue(`${parseInt(year) - 1}-W52`);
      } else if (week > 52) {
        setFilterValue(`${parseInt(year) + 1}-W01`);
      } else {
        setFilterValue(`${year}-W${String(week).padStart(2, '0')}`);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Segmented control for week/month */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
        <button
          onClick={() => {
            setFilterType("month");
            setFilterValue("");
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            filterType === "month"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Month
        </button>
        <button
          onClick={() => {
            setFilterType("week");
            setFilterValue("");
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            filterType === "week"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Week
        </button>
      </div>

      {/* Date picker with navigation arrows */}
      <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
        <button
          onClick={() => navigatePeriod(-1)}
          disabled={!filterValue}
          className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Previous ${filterType}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="px-1">
          {filterType === "week" ? (
            <input
              type="week"
              className="h-8 px-2 text-sm font-medium text-gray-700 bg-transparent border-0 focus:ring-0 outline-none cursor-pointer"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          ) : (
            <input
              type="month"
              className="h-8 px-2 text-sm font-medium text-gray-700 bg-transparent border-0 focus:ring-0 outline-none cursor-pointer"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
        </div>
        <button
          onClick={() => navigatePeriod(1)}
          disabled={!filterValue}
          className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Next ${filterType}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Display formatted period */}
      {filterValue && (
        <span className="text-sm text-gray-500 hidden sm:inline">
          {getDisplayLabel()}
        </span>
      )}
    </div>
  );
};

export default DashboardFilters;
