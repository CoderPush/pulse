import React from "react";

interface DashboardFiltersProps {
  filterType: 'week' | 'month';
  setFilterType: (type: 'week' | 'month') => void;
  filterValue: string;
  setFilterValue: (val: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filterType, setFilterType, filterValue, setFilterValue }) => (
  <div className="flex flex-col md:flex-row gap-4 gap-y-2 mb-6 items-stretch md:items-end">
    <div className="w-full md:w-auto min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">Filter by</label>
      <select
        className="border rounded px-2 py-1 w-full md:w-auto min-w-0"
        value={filterType}
        onChange={e => {
          setFilterType(e.target.value as 'week' | 'month');
          setFilterValue("");
        }}
      >
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
    </div>
    <div className="w-full md:w-auto min-w-0">
      {filterType === "week" ? (
        <input
          type="week"
          className="border rounded px-2 py-1 w-full md:w-auto min-w-0"
          value={filterValue}
          onChange={e => setFilterValue(e.target.value)}
        />
      ) : (
        <input
          type="month"
          className="border rounded px-2 py-1 w-full md:w-auto min-w-0"
          value={filterValue}
          onChange={e => setFilterValue(e.target.value)}
        />
      )}
    </div>
  </div>
);

export default DashboardFilters;
