import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
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
import { EmployeeComputed, ROLE_PERMISSIONS, UserRole } from '../types/hr';
import { countByField, getAgeBrackets, getTenureBrackets } from '../utils/analyticsAndAlerts';
import { exportReportToPdf, exportRowsToExcel } from '../utils/exports';

interface HRAnalyticsViewProps {
  employees: EmployeeComputed[];
  userRole: UserRole;
  logoUrl?: string;
}

const COLORS = ['#0C0843', '#D2A946', '#17134F', '#4F4A8A', '#E5C66F', '#7A76A8', '#9E7D28'];

export const HRAnalyticsView: React.FC<HRAnalyticsViewProps> = ({
  employees,
  userRole,
  logoUrl,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const scoped = useMemo(() => {
    return employees.filter((e) => {
      if (fromDate && (!e.resumptionDateIso || e.resumptionDateIso < fromDate)) return false;
      if (toDate && (!e.resumptionDateIso || e.resumptionDateIso > toDate)) return false;
      return true;
    });
  }, [employees, fromDate, toDate]);

  const gender = useMemo(() => countByField(scoped, (e) => e.gender), [scoped]);
  const dept = useMemo(() => countByField(scoped, (e) => e.department), [scoped]);
  const sub = useMemo(() => countByField(scoped, (e) => e.subsidiary), [scoped]);
  const location = useMemo(() => countByField(scoped, (e) => e.location), [scoped]);
  const marital = useMemo(() => countByField(scoped, (e) => e.maritalStatus), [scoped]);
  const role = useMemo(() => countByField(scoped, (e) => e.jobRole), [scoped]);
  const age = useMemo(() => getAgeBrackets(scoped), [scoped]);
  const tenure = useMemo(() => getTenureBrackets(scoped), [scoped]);
  const probation = useMemo(() => countByField(scoped, (e) => e.probationCategory), [scoped]);
  const confirmation = useMemo(() => countByField(scoped, (e) => e.confirmationCategory), [scoped]);

  const avgAge = useMemo(() => {
    const valid = scoped.filter((e) => e.ageValid && e.age !== null);
    if (!valid.length) return 'N/A';
    return (valid.reduce((s, e) => s + (e.age || 0), 0) / valid.length).toFixed(1);
  }, [scoped]);

  const avgTenure = useMemo(() => {
    const valid = scoped.filter((e) => e.tenureYears !== null);
    if (!valid.length) return 'N/A';
    return (valid.reduce((s, e) => s + (e.tenureYears || 0), 0) / valid.length).toFixed(2);
  }, [scoped]);

  const handleExportExcel = () => {
    const summaryRows = [
      ...dept.map((d) => ({ Dimension: 'Department', Category: d.name, Count: d.count, 'Share %': d.percentage })),
      ...gender.map((d) => ({ Dimension: 'Gender', Category: d.name, Count: d.count, 'Share %': d.percentage })),
      ...location.map((d) => ({ Dimension: 'Location', Category: d.name, Count: d.count, 'Share %': d.percentage })),
      ...probation.map((d) => ({ Dimension: 'Probation', Category: d.name, Count: d.count, 'Share %': d.percentage })),
      ...confirmation.map((d) => ({ Dimension: 'Confirmation', Category: d.name, Count: d.count, 'Share %': d.percentage })),
    ];
    exportRowsToExcel(summaryRows, 'HR Analytics', 'ALERT_MFB_Workforce_Analytics');
  };

  const handleExportPdf = async () => {
    const rows = [
      ...dept.map((d) => ['Department', d.name, d.count, `${d.percentage}%`]),
      ...gender.map((d) => ['Gender', d.name, d.count, `${d.percentage}%`]),
      ...marital.map((d) => ['Marital Status', d.name, d.count, `${d.percentage}%`]),
      ...probation.map((d) => ['Probation Status', d.name, d.count, `${d.percentage}%`]),
      ...confirmation.map((d) => ['Confirmation Status', d.name, d.count, `${d.percentage}%`]),
    ];
    await exportReportToPdf({
      title: 'Workforce Demographics & HR Analytics Summary',
      subtitle: `Scope: ${scoped.length} employees · Average Age: ${avgAge} yrs · Mean Current-Role Tenure: ${avgTenure} yrs`,
      columns: ['Analytics Dimension', 'Category', 'Headcount', 'Share %'],
      rows,
      fileName: 'ALERT_MFB_Workforce_Analytics',
      logoUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Analytics Control Strip */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[#6B6B80]">Analyzed Workforce: </span>
            <strong className="font-mono tabular-nums text-[#0C0843]">{scoped.length}</strong>
          </div>
          <span className="text-[#E6E5ED]">|</span>
          <div>
            <span className="text-[#6B6B80]">Mean Age: </span>
            <strong className="font-mono tabular-nums text-[#0C0843]">{avgAge} yrs</strong>
          </div>
          <span className="text-[#E6E5ED]">|</span>
          <div>
            <span className="text-[#6B6B80]">Mean Current-Role Tenure: </span>
            <strong className="font-mono tabular-nums text-[#0C0843]">{avgTenure} yrs</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#6B6B80]">Resumption:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-xs"
            />
            <span className="text-[#6B6B80]">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-xs"
            />
          </div>
          {perms.canImportExport && (
            <>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946]/60 rounded-lg hover:bg-[#F5E8C5] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D2A946]" />
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* 10 Workforce Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Workforce by Gender */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            1. Total Workforce by Gender
          </h3>
          <div className="h-56 flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={gender} dataKey="count" nameKey="name" innerRadius={48} outerRadius={78}>
                  {gender.map((g, i) => (
                    <Cell key={g.name} fill={i === 0 ? '#0C0843' : '#D2A946'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[40%] space-y-2 text-xs">
              {gender.map((g, i) => (
                <div key={g.name} className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: i === 0 ? '#0C0843' : '#D2A946' }}
                    />
                    {g.name}
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {g.count} ({g.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Workforce by Department */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            2. Workforce by Department
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dept} layout="vertical" margin={{ left: 40, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0C0843" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Workforce by Subsidiary */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            3. Workforce by Subsidiary
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sub}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#D2A946" radius={[4, 4, 0, 0]} barSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Workforce by Location */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            4. Workforce by Location
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={location} margin={{ bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#17134F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Employee Age Distribution */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            5. Employee Age Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={age}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0C0843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Marital Status Distribution */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            6. Marital Status Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marital}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={76}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {marital.map((m, i) => (
                    <Cell key={m.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Job Role Distribution */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            7. Job Role Distribution (Top 12)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={role.slice(0, 12)} layout="vertical" margin={{ left: 30, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#D2A946" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Employee Tenure (Current Job Role) */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-1">
            8. Current Job Role Tenure
          </h3>
          <p className="text-[11px] text-[#6B6B80] mb-3">
            Measured strictly from Resumption Date (Current Job Role)
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F4A8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 9. Probation Distribution */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            9. Probation Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0C0843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 10. Confirmation Distribution */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
            10. Confirmation Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confirmation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E5ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#D2A946" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
