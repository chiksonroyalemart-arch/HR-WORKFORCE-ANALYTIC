import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Search } from 'lucide-react';
import {
  DateFormatOption,
  EmployeeComputed,
  EmployeeRecord,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types/hr';
import { formatDisplayDate, parseFlexibleDate } from '../utils/dateAndCsv';
import { exportRowsToExcel } from '../utils/exports';
import { ConfirmationStatusLabel } from './StatusIndicator';

interface ConfirmationManagementViewProps {
  employees: EmployeeComputed[];
  dateFormat: DateFormatOption;
  userRole: UserRole;
  onSelectEmployee: (emp: EmployeeComputed) => void;
  onUpdateEmployee: (emp: EmployeeRecord) => Promise<void>;
}

export const ConfirmationManagementView: React.FC<ConfirmationManagementViewProps> = ({
  employees,
  dateFormat,
  userRole,
  onSelectEmployee,
  onUpdateEmployee,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [subFilter, setSubFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [confirmModalEmp, setConfirmModalEmp] = useState<EmployeeComputed | null>(null);
  const [confDate, setConfDate] = useState('');
  const [confStatus, setConfStatus] = useState('Confirmed');
  const [saving, setSaving] = useState(false);

  const metrics = useMemo(() => {
    const confirmed = employees.filter((e) => e.confirmationCategory === 'Confirmed').length;
    const awaiting = employees.filter(
      (e) => e.confirmationCategory === 'Awaiting Confirmation'
    ).length;
    const due = employees.filter((e) => e.confirmationCategory === 'Confirmation Due').length;
    const overdue = employees.filter(
      (e) => e.confirmationCategory === 'Overdue Confirmation'
    ).length;
    const rate = employees.length ? ((confirmed / employees.length) * 100).toFixed(1) : '0.0';
    return { confirmed, awaiting, due, overdue, rate };
  }, [employees]);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );
  const subsidiaries = useMemo(
    () => Array.from(new Set(employees.map((e) => e.subsidiary).filter(Boolean))).sort(),
    [employees]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (deptFilter !== 'ALL' && e.department !== deptFilter) return false;
      if (subFilter !== 'ALL' && e.subsidiary !== subFilter) return false;
      if (filterMode === 'MISSING_DATE') {
        if (e.confirmationDateIso) return false;
      } else if (filterMode === 'INCONSISTENT') {
        if (!e.hasConflict) return false;
      } else if (filterMode !== 'ALL' && e.confirmationCategory !== filterMode) {
        return false;
      }
      if (q) {
        const hay = `${e.staffCode} ${e.fullName} ${e.department} ${e.jobRole}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, deptFilter, subFilter, filterMode, search]);

  const handleSaveConfirmation = async () => {
    if (!confirmModalEmp) return;
    setSaving(true);
    try {
      const parsed = parseFlexibleDate(confDate);
      await onUpdateEmployee({
        ...confirmModalEmp,
        confirmationDateRaw: parsed.raw,
        confirmationDateIso: parsed.iso,
        confirmationStatus: confStatus,
      });
      setConfirmModalEmp(null);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const rows = filtered.map((e) => ({
      'Staff Code': e.staffCode,
      'Full Name': e.fullName,
      Department: e.department,
      'Job Role': e.jobRole,
      Subsidiary: e.subsidiary,
      'Resumption Date': formatDisplayDate(e.resumptionDateIso, e.resumptionDateRaw, dateFormat),
      'Probation End Date': formatDisplayDate(e.probationEndIso, e.probationEndRaw, dateFormat),
      'Confirmation Date': formatDisplayDate(
        e.confirmationDateIso,
        e.confirmationDateRaw,
        dateFormat
      ),
      'Recorded Status': e.confirmationStatus || 'Not Supplied',
      'Computed Category': e.confirmationCategory,
    }));
    exportRowsToExcel(rows, 'Confirmations', 'ALERT_MFB_Confirmation_Monitoring');
  };

  return (
    <div className="space-y-5">
      {/* 5 Confirmation KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setFilterMode('Confirmed')}
          className="bg-white border border-[#E6E5ED] rounded-xl p-4 text-left hover:border-[#D2A946] cursor-pointer"
        >
          <p className="text-[11px] font-medium text-[#6B6B80]">Total Confirmed</p>
          <p className="font-display text-2xl font-bold text-[#166534] tabular-nums mt-1">
            {metrics.confirmed}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('Awaiting Confirmation')}
          className="bg-white border border-[#E6E5ED] rounded-xl p-4 text-left hover:border-[#D2A946] cursor-pointer"
        >
          <p className="text-[11px] font-medium text-[#6B6B80]">Awaiting Confirmation</p>
          <p className="font-display text-2xl font-bold text-[#0C0843] tabular-nums mt-1">
            {metrics.awaiting}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('Confirmation Due')}
          className="bg-white border border-[#E6E5ED] rounded-xl p-4 text-left hover:border-[#D2A946] cursor-pointer"
        >
          <p className="text-[11px] font-medium text-[#6B6B80]">Confirmation Due</p>
          <p className="font-display text-2xl font-bold text-[#8C6812] tabular-nums mt-1">
            {metrics.due}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('Overdue Confirmation')}
          className="bg-white border border-[#E6E5ED] rounded-xl p-4 text-left hover:border-[#D2A946] cursor-pointer"
        >
          <p className="text-[11px] font-medium text-[#6B6B80]">Overdue Confirmation</p>
          <p className="font-display text-2xl font-bold text-[#DC2626] tabular-nums mt-1">
            {metrics.overdue}
          </p>
        </button>
        <div className="bg-white border border-[#E6E5ED] rounded-xl p-4">
          <p className="text-[11px] font-medium text-[#6B6B80]">Confirmation Rate</p>
          <p className="font-display text-2xl font-bold text-[#0C0843] tabular-nums mt-1">
            {metrics.rate}%
          </p>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg font-medium"
          >
            <option value="ALL">All Confirmation States</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Confirmation Due">Confirmation Due</option>
            <option value="Overdue Confirmation">Overdue Confirmation</option>
            <option value="Awaiting Confirmation">Awaiting Confirmation</option>
            <option value="MISSING_DATE">Missing Confirmation Dates</option>
            <option value="INCONSISTENT">Inconsistent Records</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
          >
            <option value="ALL">All Subsidiaries</option>
            {subsidiaries.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#6B6B80] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or staff code..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
            />
          </div>
          {perms.canImportExport && (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946]/60 rounded-lg hover:bg-[#F5E8C5] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Table */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0C0843] text-white">
                <th className="px-3.5 py-3 font-semibold">Staff Code</th>
                <th className="px-3.5 py-3 font-semibold">Full Name</th>
                <th className="px-3.5 py-3 font-semibold">Department</th>
                <th className="px-3.5 py-3 font-semibold">Job Role</th>
                <th className="px-3.5 py-3 font-semibold">Subsidiary</th>
                <th className="px-3.5 py-3 font-semibold">Resumption Date</th>
                <th className="px-3.5 py-3 font-semibold">Probation End Date</th>
                <th className="px-3.5 py-3 font-semibold">Confirmation Date</th>
                <th className="px-3.5 py-3 font-semibold">Confirmation Status</th>
                <th className="px-3.5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E5ED]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[#6B6B80]">
                    No confirmation records match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F6F6FA]">
                    <td className="px-3.5 py-2.5 font-mono text-[#0C0843] font-medium whitespace-nowrap">
                      {emp.staffCode}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectEmployee(emp)}
                        className="font-semibold text-[#0C0843] hover:underline cursor-pointer text-left"
                      >
                        {emp.fullName}
                      </button>
                      {emp.hasConflict && (
                        <span
                          title={emp.conflictReasons.join('; ')}
                          className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-[#991B1B]"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Check
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-[#17172B] whitespace-nowrap">
                      {emp.department}
                    </td>
                    <td className="px-3.5 py-2.5 text-[#6B6B80] whitespace-nowrap">
                      {emp.jobRole}
                    </td>
                    <td className="px-3.5 py-2.5 text-[#6B6B80] whitespace-nowrap">
                      {emp.subsidiary}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono tabular-nums text-[#6B6B80] whitespace-nowrap">
                      {formatDisplayDate(emp.resumptionDateIso, emp.resumptionDateRaw, dateFormat)}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono tabular-nums text-[#6B6B80] whitespace-nowrap">
                      {formatDisplayDate(emp.probationEndIso, emp.probationEndRaw, dateFormat)}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono tabular-nums text-[#17172B] whitespace-nowrap">
                      {formatDisplayDate(
                        emp.confirmationDateIso,
                        emp.confirmationDateRaw,
                        dateFormat
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <ConfirmationStatusLabel category={emp.confirmationCategory} />
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      {perms.canManageProbationConfirmation ? (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModalEmp(emp);
                            setConfDate(emp.confirmationDateIso || new Date().toISOString().slice(0, 10));
                            setConfStatus(emp.confirmationStatus || 'Confirmed');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EDECF5] text-[#0C0843] font-semibold hover:bg-[#D2A946] transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Update
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectEmployee(emp)}
                          className="text-[#0C0843] font-medium hover:underline cursor-pointer"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Update Modal */}
      {confirmModalEmp && (
        <div className="fixed inset-0 z-50 bg-[#0C0843]/55 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E5ED] rounded-xl max-w-md w-full p-6 shadow-lg space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-[#0C0843]">
                Update Employee Confirmation
              </h3>
              <p className="text-xs text-[#6B6B80]">
                {confirmModalEmp.fullName} ({confirmModalEmp.staffCode})
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Confirmation Date
              </label>
              <input
                type="date"
                value={confDate}
                onChange={(e) => setConfDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Confirmation Status
              </label>
              <select
                value={confStatus}
                onChange={(e) => setConfStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Deferred">Deferred</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalEmp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6B80] bg-white border border-[#E6E5ED] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveConfirmation}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Confirmation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
