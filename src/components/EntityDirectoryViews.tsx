import React, { useMemo, useState } from 'react';
import { Building2, Briefcase, GitBranch, MapPin, Users, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DateFormatOption, EmployeeComputed } from '../types/hr';
import { formatDisplayDate } from '../utils/dateAndCsv';
import { ConfirmationStatusLabel, ProbationStatusLabel } from './StatusIndicator';

interface EntityDirectoryViewsProps {
  mode: 'departments' | 'job_roles' | 'subsidiaries' | 'locations';
  employees: EmployeeComputed[];
  dateFormat: DateFormatOption;
  onSelectEmployee: (emp: EmployeeComputed) => void;
}

export const EntityDirectoryViews: React.FC<EntityDirectoryViewsProps> = ({
  mode,
  employees,
  dateFormat,
  onSelectEmployee,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const meta = {
    departments: {
      title: 'Departments Breakdown',
      subtitle: 'Headcount, gender balance, and confirmation metrics across ALERT MFB departments',
      icon: Building2,
      extractor: (e: EmployeeComputed) => e.department || 'Unspecified',
    },
    job_roles: {
      title: 'Job Roles Breakdown',
      subtitle: 'Workforce distribution and probation/confirmation tracking by job designation',
      icon: Briefcase,
      extractor: (e: EmployeeComputed) => e.jobRole || 'Unspecified',
    },
    subsidiaries: {
      title: 'Subsidiaries Overview',
      subtitle: 'Corporate entity distribution and operational headcount',
      icon: GitBranch,
      extractor: (e: EmployeeComputed) => e.subsidiary || 'Unspecified',
    },
    locations: {
      title: 'Locations & Branch Network',
      subtitle: 'Headquarters and nationwide branch staffing across Nigeria',
      icon: MapPin,
      extractor: (e: EmployeeComputed) => e.location || 'Unspecified',
    },
  }[mode];

  const groups = useMemo(() => {
    const map = new Map<string, EmployeeComputed[]>();
    employees.forEach((emp) => {
      const key = meta.extractor(emp);
      const list = map.get(key) || [];
      list.push(emp);
      map.set(key, list);
    });
    return Array.from(map.entries())
      .map(([name, list]) => {
        const male = list.filter((e) => e.gender.toLowerCase() === 'male').length;
        const female = list.filter((e) => e.gender.toLowerCase() === 'female').length;
        const confirmed = list.filter((e) => e.confirmationCategory === 'Confirmed').length;
        const onProbation = list.filter((e) =>
          ['In Progress', 'Approaching Deadline', 'Due Within 7 Days', 'Overdue'].includes(
            e.probationCategory
          )
        ).length;
        return {
          name,
          count: list.length,
          percentage: employees.length ? Number(((list.length / employees.length) * 100).toFixed(1)) : 0,
          male,
          female,
          confirmed,
          onProbation,
          employees: list,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [employees, meta]);

  const activeGroupObj = useMemo(
    () => groups.find((g) => g.name === selectedGroup) || groups[0] || null,
    [groups, selectedGroup]
  );

  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      {/* Header Summary + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-lg bg-[#EDECF5] text-[#0C0843]">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-display text-base font-bold text-[#0C0843]">{meta.title}</h2>
            </div>
            <p className="text-xs text-[#6B6B80] leading-relaxed">{meta.subtitle}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E6E5ED] grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6B6B80]">Total Groups</p>
              <p className="font-display text-2xl font-bold text-[#0C0843] tabular-nums">
                {groups.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B6B80]">Staff Covered</p>
              <p className="font-display text-2xl font-bold text-[#0C0843] tabular-nums">
                {employees.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            Headcount Distribution
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groups.slice(0, 14)}
                margin={{ top: 4, right: 12, left: -16, bottom: 28 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6B6B80' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B6B80' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0C0843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((g) => {
          const isSelected = activeGroupObj?.name === g.name;
          return (
            <button
              key={g.name}
              type="button"
              onClick={() => setSelectedGroup(g.name)}
              className={`text-left rounded-xl p-4 border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#0C0843] text-white border-[#0C0843]'
                  : 'bg-white text-[#17172B] border-[#E6E5ED] hover:border-[#D2A946]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`font-display text-sm font-bold truncate ${
                    isSelected ? 'text-white' : 'text-[#0C0843]'
                  }`}
                  title={g.name}
                >
                  {g.name}
                </p>
                <span
                  className={`font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded shrink-0 ${
                    isSelected ? 'bg-[#D2A946] text-[#0C0843]' : 'bg-[#EDECF5] text-[#0C0843]'
                  }`}
                >
                  {g.count}
                </span>
              </div>
              <div
                className={`mt-3 flex items-center justify-between text-xs ${
                  isSelected ? 'text-[#EDECF5]/85' : 'text-[#6B6B80]'
                }`}
              >
                <span className="tabular-nums">
                  M: {g.male} · F: {g.female}
                </span>
                <span className="tabular-nums">{g.percentage}%</span>
              </div>
              <div
                className={`mt-2 pt-2 border-t flex items-center justify-between text-[11px] ${
                  isSelected ? 'border-white/15 text-[#E5C66F]' : 'border-[#E6E5ED] text-[#6B6B80]'
                }`}
              >
                <span>
                  Confirmed: {g.confirmed} · Probation: {g.onProbation}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Group Drill-Down Table */}
      {activeGroupObj && (
        <div className="bg-white border border-[#E6E5ED] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E5ED] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D2A946]" />
              <h3 className="font-display text-sm font-bold text-[#0C0843]">
                Staff in {activeGroupObj.name} ({activeGroupObj.count})
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F6F6FA] text-[#6B6B80] border-b border-[#E6E5ED]">
                  <th className="px-4 py-2.5 font-semibold">Staff Code</th>
                  <th className="px-4 py-2.5 font-semibold">Full Name</th>
                  <th className="px-4 py-2.5 font-semibold">Department</th>
                  <th className="px-4 py-2.5 font-semibold">Job Role</th>
                  <th className="px-4 py-2.5 font-semibold">Location</th>
                  <th className="px-4 py-2.5 font-semibold">Resumption</th>
                  <th className="px-4 py-2.5 font-semibold">Probation</th>
                  <th className="px-4 py-2.5 font-semibold">Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E5ED]">
                {activeGroupObj.employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="hover:bg-[#FBF6E9]/60 cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-mono text-[#0C0843] font-medium">
                      {emp.staffCode}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#17172B]">{emp.fullName}</td>
                    <td className="px-4 py-2.5 text-[#6B6B80]">{emp.department}</td>
                    <td className="px-4 py-2.5 text-[#6B6B80]">{emp.jobRole}</td>
                    <td className="px-4 py-2.5 text-[#6B6B80]">{emp.location}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-[#6B6B80]">
                      {formatDisplayDate(emp.resumptionDateIso, emp.resumptionDateRaw, dateFormat)}
                    </td>
                    <td className="px-4 py-2.5">
                      <ProbationStatusLabel category={emp.probationCategory} />
                    </td>
                    <td className="px-4 py-2.5">
                      <ConfirmationStatusLabel category={emp.confirmationCategory} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
