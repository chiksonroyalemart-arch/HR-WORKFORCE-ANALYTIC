import React from 'react';
import { RotateCcw } from 'lucide-react';
import { GlobalFilters } from '../types/hr';

interface GlobalFilterBarProps {
  filters: GlobalFilters;
  onChange: (next: GlobalFilters) => void;
  onReset: () => void;
  options: {
    departments: string[];
    jobRoles: string[];
    subsidiaries: string[];
    locations: string[];
    genders: string[];
    maritalStatuses: string[];
    probationCategories: string[];
    confirmationCategories: string[];
  };
  totalCount: number;
  filteredCount: number;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  options,
  totalCount,
  filteredCount,
}) => {
  const update = (key: keyof GlobalFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border-b border-[#E6E5ED] px-4 sm:px-6 py-4 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs text-[#6B6B80]">
          <span className="font-semibold text-[#0C0843]">Global Workforce Filters</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            Showing <strong className="text-[#0C0843]">{filteredCount}</strong> of{' '}
            <strong className="text-[#0C0843]">{totalCount}</strong> employees
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946]/60 rounded-lg hover:bg-[#F5E8C5] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="md:hidden">
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Name or staff code..."
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">Department</label>
          <select
            value={filters.department}
            onChange={(e) => update('department', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Departments</option>
            {options.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">Job Role</label>
          <select
            value={filters.jobRole}
            onChange={(e) => update('jobRole', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Job Roles</option>
            {options.jobRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">Subsidiary</label>
          <select
            value={filters.subsidiary}
            onChange={(e) => update('subsidiary', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Subsidiaries</option>
            {options.subsidiaries.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">Location</label>
          <select
            value={filters.location}
            onChange={(e) => update('location', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Locations</option>
            {options.locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">Gender</label>
          <select
            value={filters.gender}
            onChange={(e) => update('gender', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Genders</option>
            {options.genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">Marital Status</label>
          <select
            value={filters.maritalStatus}
            onChange={(e) => update('maritalStatus', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Statuses</option>
            {options.maritalStatuses.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">
            Probation Status
          </label>
          <select
            value={filters.probationStatus}
            onChange={(e) => update('probationStatus', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Probation States</option>
            {options.probationCategories.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">
            Confirmation Status
          </label>
          <select
            value={filters.confirmationStatus}
            onChange={(e) => update('confirmationStatus', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          >
            <option value="ALL">All Confirmation States</option>
            {options.confirmationCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">
            Resumption From
          </label>
          <input
            type="date"
            value={filters.resumptionFrom}
            onChange={(e) => update('resumptionFrom', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">
            Resumption To
          </label>
          <input
            type="date"
            value={filters.resumptionTo}
            onChange={(e) => update('resumptionTo', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B]"
          />
        </div>
      </div>
    </div>
  );
};
