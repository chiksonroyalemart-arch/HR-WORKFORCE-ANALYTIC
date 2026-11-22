import React, { useMemo } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  GitBranch,
  MapPin,
  Clock,
  CheckCircle2,
  Hourglass,
  Plus,
  FileSpreadsheet,
  ArrowRight,
  AlertTriangle,
  Cake,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  DateFormatOption,
  EmployeeComputed,
  NavPage,
  UserRole,
  ROLE_PERMISSIONS,
} from '../types/hr';
import {
  countByField,
  getAgeBrackets,
  getTenureBrackets,
} from '../utils/analyticsAndAlerts';
import { formatDisplayDate } from '../utils/dateAndCsv';
import { ProbationStatusLabel } from './StatusIndicator';

interface DashboardViewProps {
  employees: EmployeeComputed[];
  dateFormat: DateFormatOption;
  userRole: UserRole;
  onSelectEmployee: (emp: EmployeeComputed) => void;
  onNavigate: (page: NavPage) => void;
  onOpenAddEmployee: () => void;
}

const CHART_PALETTE = [
  '#0C0843',
  '#D2A946',
  '#17134F',
  '#4F4A8A',
  '#E5C66F',
  '#7A76A8',
  '#9E7D28',
  '#2E296B',
  '#A5A2C4',
  '#C49B33',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  dateFormat,
  userRole,
  onSelectEmployee,
  onNavigate,
  onOpenAddEmployee,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];

  const stats = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department).filter(Boolean));
    const roles = new Set(employees.map((e) => e.jobRole).filter(Boolean));
    const subs = new Set(employees.map((e) => e.subsidiary).filter(Boolean));
    const locs = new Set(employees.map((e) => e.location).filter(Boolean));

    const onProbation = employees.filter((e) =>
      ['In Progress', 'Approaching Deadline', 'Due Within 7 Days', 'Overdue'].includes(
        e.probationCategory
      )
    ).length;

    const confirmed = employees.filter((e) => e.confirmationCategory === 'Confirmed').length;
    const awaitingConfirmation = employees.filter((e) =>
      ['Awaiting Confirmation', 'Confirmation Due', 'Overdue Confirmation'].includes(
        e.confirmationCategory
      )
    ).length;

    return {
      totalEmployees: employees.length,
      totalDepartments: depts.size,
      totalJobRoles: roles.size,
      totalSubsidiaries: subs.size,
      totalLocations: locs.size,
      onProbation,
      confirmed,
      awaitingConfirmation,
    };
  }, [employees]);

  const deptData = useMemo(() => countByField(employees, (e) => e.department), [employees]);
  const subData = useMemo(() => countByField(employees, (e) => e.subsidiary), [employees]);
  const genderData = useMemo(() => countByField(employees, (e) => e.gender), [employees]);
  const maritalData = useMemo(() => countByField(employees, (e) => e.maritalStatus), [employees]);
  const locationData = useMemo(
    () => countByField(employees, (e) => e.location).slice(0, 12),
    [employees]
  );
  const jobRoleData = useMemo(
    () => countByField(employees, (e) => e.jobRole).slice(0, 10),
    [employees]
  );
  const ageData = useMemo(() => getAgeBrackets(employees), [employees]);
  const tenureData = useMemo(() => getTenureBrackets(employees), [employees]);
  const probationOverview = useMemo(
    () => countByField(employees, (e) => e.probationCategory),
    [employees]
  );
  const confirmationOverview = useMemo(
    () => countByField(employees, (e) => e.confirmationCategory),
    [employees]
  );

  const upcomingProbations = useMemo(
    () =>
      employees
        .filter((e) =>
          ['Due Within 7 Days', 'Approaching Deadline', 'Overdue'].includes(e.probationCategory)
        )
        .sort((a, b) => (a.probationDaysRemaining ?? 999) - (b.probationDaysRemaining ?? 999))
        .slice(0, 6),
    [employees]
  );

  const awaitingConfirmationList = useMemo(
    () =>
      employees
        .filter((e) =>
          ['Overdue Confirmation', 'Confirmation Due', 'Awaiting Confirmation'].includes(
            e.confirmationCategory
          )
        )
        .slice(0, 6),
    [employees]
  );

  const upcomingBirthdays = useMemo(
    () =>
      employees
        .filter((e) => e.daysUntilBirthday !== null && e.daysUntilBirthday <= 30)
        .sort((a, b) => (a.daysUntilBirthday ?? 99) - (b.daysUntilBirthday ?? 99))
        .slice(0, 6),
    [employees]
  );

  const attentionList = useMemo(
    () => employees.filter((e) => e.hasConflict || e.invalidDateFields.length > 0).slice(0, 6),
    [employees]
  );

  const kpiCards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      desc: 'Active records in dataset',
      icon: Users,
      accent: 'text-[#0C0843] bg-[#EDECF5]',
      onClick: () => onNavigate('directory'),
    },
    {
      label: 'Total Departments',
      value: stats.totalDepartments,
      desc: 'Distinct operational units',
      icon: Building2,
      accent: 'text-[#0C0843] bg-[#EDECF5]',
      onClick: () => onNavigate('departments'),
    },
    {
      label: 'Total Job Roles',
      value: stats.totalJobRoles,
      desc: 'Unique role designations',
      icon: Briefcase,
      accent: 'text-[#0C0843] bg-[#EDECF5]',
      onClick: () => onNavigate('job_roles'),
    },
    {
      label: 'Total Subsidiaries',
      value: stats.totalSubsidiaries,
      desc: 'Corporate entities tracked',
      icon: GitBranch,
      accent: 'text-[#0C0843] bg-[#EDECF5]',
      onClick: () => onNavigate('subsidiaries'),
    },
    {
      label: 'Total Locations',
      value: stats.totalLocations,
      desc: 'HQ & regional branches',
      icon: MapPin,
      accent: 'text-[#0C0843] bg-[#EDECF5]',
      onClick: () => onNavigate('locations'),
    },
    {
      label: 'Employees on Probation',
      value: stats.onProbation,
      desc: 'Active, due, or overdue 6m',
      icon: Clock,
      accent: 'text-[#8C6812] bg-[#FBF6E9]',
      onClick: () => onNavigate('probation'),
    },
    {
      label: 'Confirmed Employees',
      value: stats.confirmed,
      desc: 'Recorded confirmed status',
      icon: CheckCircle2,
      accent: 'text-[#166534] bg-[#DCFCE7]',
      onClick: () => onNavigate('confirmation'),
    },
    {
      label: 'Awaiting Confirmation',
      value: stats.awaitingConfirmation,
      desc: 'Pending or due confirmation',
      icon: Hourglass,
      accent: 'text-[#8C6812] bg-[#FBF6E9]',
      onClick: () => onNavigate('confirmation'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ROW 1: WORKFORCE KPI CARDS */}
      <section aria-label="Workforce KPIs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="bg-white border border-[#E6E5ED] rounded-xl p-5 text-left hover:border-[#D2A946] transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#6B6B80]">{card.label}</p>
                    <p className="font-display text-3xl font-bold text-[#0C0843] tabular-nums mt-1.5">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${card.accent} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E6E5ED] flex items-center justify-between text-xs text-[#6B6B80]">
                  <span>{card.desc}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D2A946] opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ROW 2: WORKFORCE DISTRIBUTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Employees by Department Doughnut */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0C0843]">
                Employees by Department
              </h2>
              <p className="text-xs text-[#6B6B80]">Headcount and percentage share</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('departments')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {deptData.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [`${val} staff`, String(name)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {deptData.map((d, idx) => (
                <div key={d.name} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
                    />
                    <span className="text-[#17172B] truncate" title={d.name}>
                      {d.name}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-[#0C0843] font-semibold shrink-0">
                    {d.count} ({d.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gender Distribution Doughnut */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h2 className="font-display text-sm font-bold text-[#0C0843]">Gender Distribution</h2>
          <p className="text-xs text-[#6B6B80] mb-3">Workforce gender composition</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                >
                  {genderData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={idx === 0 ? '#0C0843' : idx === 1 ? '#D2A946' : '#7A76A8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {genderData.map((g, idx) => (
              <div key={g.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#17172B]">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: idx === 0 ? '#0C0843' : idx === 1 ? '#D2A946' : '#7A76A8',
                    }}
                  />
                  {g.name}
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#0C0843]">
                  {g.count} ({g.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Marital Status & Subsidiary Split */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-[#0C0843]">Marital Status</h2>
            <p className="text-xs text-[#6B6B80] mb-3">Recorded employee categories</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maritalData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B6B80' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B6B80' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0C0843" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#E6E5ED]">
            <p className="text-xs font-semibold text-[#0C0843] mb-1.5">Subsidiary Headcount</p>
            {subData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="text-[#6B6B80]">{s.name}</span>
                <span className="font-mono tabular-nums font-semibold text-[#0C0843]">
                  {s.count} ({s.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROW 3: HR MONITORING */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Probation Overview */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0C0843]">Probation Overview</h2>
              <p className="text-xs text-[#6B6B80]">6-month current position tracking</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('probation')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              Manage
            </button>
          </div>
          <div className="space-y-2.5">
            {probationOverview.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#17172B] font-medium">{p.name}</span>
                  <span className="font-mono tabular-nums text-[#0C0843] font-semibold">
                    {p.count} ({p.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#EDECF5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.percentage}%`,
                      backgroundColor:
                        p.name === 'Completed'
                          ? '#16A34A'
                          : p.name === 'Overdue'
                          ? '#DC2626'
                          : p.name.includes('7') || p.name.includes('Approaching')
                          ? '#D2A946'
                          : '#0C0843',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Overview */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0C0843]">
                Confirmation Overview
              </h2>
              <p className="text-xs text-[#6B6B80]">Recorded confirmation outcomes</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('confirmation')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              Tracker
            </button>
          </div>
          <div className="space-y-2.5">
            {confirmationOverview.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#17172B] font-medium">{c.name}</span>
                  <span className="font-mono tabular-nums text-[#0C0843] font-semibold">
                    {c.count} ({c.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#EDECF5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.percentage}%`,
                      backgroundColor:
                        c.name === 'Confirmed'
                          ? '#16A34A'
                          : c.name === 'Overdue Confirmation'
                          ? '#DC2626'
                          : c.name === 'Confirmation Due'
                          ? '#D2A946'
                          : '#0C0843',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employees by Location */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0C0843]">
                Employees by Location
              </h2>
              <p className="text-xs text-[#6B6B80]">Top branches &amp; HQ distribution</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('locations')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              All Branches
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} margin={{ top: 4, right: 8, left: -18, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6B6B80' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B6B80' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#D2A946" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ROW 4: EMPLOYEE ANALYTICS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Age Distribution */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h2 className="font-display text-sm font-bold text-[#0C0843]">Age Distribution</h2>
          <p className="text-xs text-[#6B6B80] mb-3">Calculated dynamically from DOB</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 4, right: 8, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B6B80' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B6B80' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0C0843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Tenure (Current Job Role) */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h2 className="font-display text-sm font-bold text-[#0C0843]">
            Current-Role Tenure Analysis
          </h2>
          <p className="text-xs text-[#6B6B80] mb-3">
            Calculated from Current Job Role Resumption Date
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureData} margin={{ top: 4, right: 8, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B6B80' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B6B80' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#17134F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Role Distribution (Horizontal Bar) */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0C0843]">
                Job Role Distribution
              </h2>
              <p className="text-xs text-[#6B6B80]">Top 10 designations by headcount</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('job_roles')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              All Roles
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jobRoleData}
                layout="vertical"
                margin={{ top: 2, right: 16, left: 10, bottom: 2 }}
              >
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6B6B80' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10, fill: '#17172B' }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#D2A946" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ROW 5: HR ACTION CENTRE */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Probation Deadlines */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-[#0C0843]">
              Upcoming &amp; Overdue Probation Deadlines
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('probation')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              Open Tracker
            </button>
          </div>
          {upcomingProbations.length === 0 ? (
            <p className="text-xs text-[#6B6B80] py-6 text-center">
              No overdue or upcoming probation deadlines within 30 days.
            </p>
          ) : (
            <div className="divide-y divide-[#E6E5ED]">
              {upcomingProbations.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => onSelectEmployee(emp)}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6F6FA] px-2 rounded transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0C0843] truncate">{emp.fullName}</p>
                    <p className="text-[11px] text-[#6B6B80] truncate">
                      <span className="font-mono">{emp.staffCode}</span> · {emp.department} · Ends{' '}
                      {formatDisplayDate(emp.probationEndIso, emp.probationEndRaw, dateFormat)}
                    </p>
                  </div>
                  <ProbationStatusLabel category={emp.probationCategory} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employees Awaiting Confirmation */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-[#0C0843]">
              Employees Awaiting Confirmation
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('confirmation')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              Manage Confirmations
            </button>
          </div>
          {awaitingConfirmationList.length === 0 ? (
            <p className="text-xs text-[#6B6B80] py-6 text-center">
              No employees currently awaiting confirmation.
            </p>
          ) : (
            <div className="divide-y divide-[#E6E5ED]">
              {awaitingConfirmationList.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => onSelectEmployee(emp)}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6F6FA] px-2 rounded transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0C0843] truncate">{emp.fullName}</p>
                    <p className="text-[11px] text-[#6B6B80] truncate">
                      <span className="font-mono">{emp.staffCode}</span> · {emp.jobRole} ·{' '}
                      {emp.location}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#8C6812] bg-[#FBF6E9] border border-[#D2A946]/50 px-2 py-0.5 rounded shrink-0">
                    {emp.confirmationCategory}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-[#0C0843] flex items-center gap-2">
              <Cake className="w-4 h-4 text-[#D2A946]" />
              Upcoming Birthdays (Next 30 Days)
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              View Alerts
            </button>
          </div>
          {upcomingBirthdays.length === 0 ? (
            <p className="text-xs text-[#6B6B80] py-6 text-center">
              No employee birthdays within the next 30 days.
            </p>
          ) : (
            <div className="divide-y divide-[#E6E5ED]">
              {upcomingBirthdays.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => onSelectEmployee(emp)}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6F6FA] px-2 rounded transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0C0843] truncate">{emp.fullName}</p>
                    <p className="text-[11px] text-[#6B6B80] truncate">
                      {emp.department} · {emp.location} ·{' '}
                      {formatDisplayDate(emp.dobIso, emp.dobRaw, dateFormat)}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#0C0843] bg-[#EDECF5] px-2 py-0.5 rounded shrink-0">
                    {emp.daysUntilBirthday === 0 ? 'Today' : `In ${emp.daysUntilBirthday}d`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employees Requiring HR Attention */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-[#0C0843] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              Records Requiring HR Attention
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('data_management')}
              className="text-xs font-semibold text-[#0C0843] hover:text-[#D2A946] cursor-pointer"
            >
              Data Audit
            </button>
          </div>
          {attentionList.length === 0 ? (
            <p className="text-xs text-[#6B6B80] py-6 text-center">
              All employee records pass validation checks.
            </p>
          ) : (
            <div className="divide-y divide-[#E6E5ED]">
              {attentionList.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => onSelectEmployee(emp)}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6F6FA] px-2 rounded transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0C0843] truncate">
                      {emp.fullName} ({emp.staffCode})
                    </p>
                    <p className="text-[11px] text-[#991B1B] truncate">
                      {emp.conflictReasons[0] || emp.invalidDateFields[0]}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#0C0843] shrink-0">Review</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ROW 6: QUICK ACTIONS */}
      <section className="bg-white border border-[#E6E5ED] rounded-xl p-5">
        <h2 className="font-display text-sm font-bold text-[#0C0843] mb-3">Quick HR Actions</h2>
        <div className="flex flex-wrap gap-3">
          {perms.canAddDeleteEmployees && (
            <button
              type="button"
              onClick={onOpenAddEmployee}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0C0843] text-white text-xs font-semibold hover:bg-[#17134F] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D2A946]" />
              Add Employee
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('directory')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EDECF5] text-[#0C0843] text-xs font-semibold hover:bg-[#E1DFF0] transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            View Employee Directory
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FBF6E9] border border-[#D2A946]/60 text-[#0C0843] text-xs font-semibold hover:bg-[#F5E8C5] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#8C6812]" />
            Generate Report
          </button>
          <button
            type="button"
            onClick={() => onNavigate('probation')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#E6E5ED] text-[#0C0843] text-xs font-semibold hover:bg-[#F6F6FA] transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 text-[#D2A946]" />
            Track Probation
          </button>
          <button
            type="button"
            onClick={() => onNavigate('confirmation')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#E6E5ED] text-[#0C0843] text-xs font-semibold hover:bg-[#F6F6FA] transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            Manage Confirmations
          </button>
        </div>
      </section>
    </div>
  );
};
