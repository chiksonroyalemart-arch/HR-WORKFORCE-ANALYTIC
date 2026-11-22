import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, Search } from 'lucide-react';
import {
  DateFormatOption,
  EmployeeComputed,
  EmployeeRecord,
  ProbationCategory,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types/hr';
import { formatDisplayDate } from '../utils/dateAndCsv';
import { exportRowsToExcel } from '../utils/exports';
import { ProbationStatusLabel } from './StatusIndicator';

interface ProbationManagementViewProps {
  employees: EmployeeComputed[];
  dateFormat: DateFormatOption;
  userRole: UserRole;
  onSelectEmployee: (emp: EmployeeComputed) => void;
  onUpdateEmployee: (emp: EmployeeRecord) => Promise<void>;
}

export const ProbationManagementView: React.FC<ProbationManagementViewProps> = ({
  employees,
  dateFormat,
  userRole,
  onSelectEmployee,
  onUpdateEmployee,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [editingEmp, setEditingEmp] = useState<EmployeeComputed | null>(null);
  const [nextProbStatus, setNextProbStatus] = useState('Completed');
  const [saving, setSaving] = useState(false);

  const metrics = useMemo(() => {
    const requiring = employees.filter(
      (e) => e.probationRequired.trim().toLowerCase() !== 'no'
    ).length;
    const currentlyOn = employees.filter((e) =>
      ['In Progress', 'Approaching Deadline', 'Due Within 7 Days', 'Overdue'].includes(
        e.probationCategory
      )
    ).length;
    const ending7 = employees.filter((e) => e.probationCategory === 'Due Within 7 Days').length;
    const ending30 = employees.filter(
      (e) =>
        e.probationCategory === 'Approaching Deadline' ||
        e.probationCategory === 'Due Within 7 Days'
    ).length;
    const overdue = employees.filter((e) => e.probationCategory === 'Overdue').length;
    const completed = employees.filter((e) => e.probationCategory === 'Completed').length;

    return { requiring, currentlyOn, ending7, ending30, overdue, completed };
  }, [employees]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees
      .filter((e) => {
        if (statusFilter === 'CONFLICT') {
          if (!e.conflictReasons.some((r) => r.toLowerCase().includes('probation'))) return false;
        } else if (statusFilter !== 'ALL' && e.probationCategory !== statusFilter) {
          return false;
        }
        if (q) {
          const hay = `${e.staffCode} ${e.fullName} ${e.department} ${e.jobRole}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.probationDaysRemaining ?? 9999) - (b.probationDaysRemaining ?? 9999));
  }, [employees, statusFilter, search]);

  const handleSaveOutcome = async () => {
    if (!editingEmp) return;
    setSaving(true);
    try {
      await onUpdateEmployee({
        ...editingEmp,
        probationStatus: nextProbStatus,
      });
      setEditingEmp(null);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const rows = filteredRows.map((e) => ({
      'Staff Code': e.staffCode,
      'Employee Name': e.fullName,
      Department: e.department,
      'Job Role': e.jobRole,
      Subsidiary: e.subsidiary,
      'Probation Start Date': formatDisplayDate(e.probationStartIso, e.probationStartRaw, dateFormat),
      'Probation End Date': formatDisplayDate(e.probationEndIso, e.probationEndRaw, dateFormat),
      'Days Remaining': e.probationDaysRemaining ?? 'N/A',
      'Computed Status': e.probationCategory,
      'Recorded Status': e.probationStatus || 'Not Supplied',
      'Confirmation Status': e.confirmationStatus || 'Pending',
    }));
    exportRowsToExcel(rows, 'Probation Tracker', 'ALERT_MFB_Probation_Monitoring');
  };

  const kpiList: { label: string; value: number; filter: string; tone: string }[] = [
    { label: 'Requiring Probation', value: metrics.requiring, filter: 'ALL', tone: 'text-[#0C0843]' },
    { label: 'Currently on Probation', value: metrics.currentlyOn, filter: 'In Progress', tone: 'text-[#0C0843]' },
    { label: 'Ending Within 7 Days', value: metrics.ending7, filter: 'Due Within 7 Days', tone: 'text-[#B45309]' },
    { label: 'Ending Within 30 Days', value: metrics.ending30, filter: 'Approaching Deadline', tone: 'text-[#8C6812]' },
    { label: 'Overdue Probation', value: metrics.overdue, filter: 'Overdue', tone: 'text-[#DC2626]' },
    { label: 'Completed Probation', value: metrics.completed, filter: 'Completed', tone: 'text-[#166534]' },
  ];

  const categories: (ProbationCategory | 'ALL' | 'CONFLICT')[] = [
    'ALL',
    'Overdue',
    'Due Within 7 Days',
    'Approaching Deadline',
    'In Progress',
    'Completed',
    'Not Required',
    'CONFLICT',
  ];

  return (
    <div className="space-y-5">
      {/* 6 Probation KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiList.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => setStatusFilter(k.filter)}
            className={`bg-white border rounded-xl p-4 text-left transition-colors cursor-pointer ${
              statusFilter === k.filter ? 'border-[#0C0843] bg-[#EDECF5]/40' : 'border-[#E6E5ED] hover:border-[#D2A946]'
            }`}
          >
            <p className="text-[11px] font-medium text-[#6B6B80]">{k.label}</p>
            <p className={`font-display text-2xl font-bold tabular-nums mt-1 ${k.tone}`}>
              {k.value}
            </p>
          </button>
        ))}
      </div>

      {/* Integrity Rule Notice */}
      <div className="bg-[#FBF6E9] border border-[#D2A946]/60 rounded-xl px-4 py-3 text-xs text-[#17172B] flex items-center gap-2.5">
        <Clock className="w-4 h-4 text-[#8C6812] shrink-0" />
        <span>
          <strong>Policy Enforcement:</strong> Employees are never auto-confirmed when probation
          dates elapse. Records where recorded probation status conflicts with dates are flagged for
          HR review.
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setStatusFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === cat
                  ? 'bg-[#0C0843] text-white'
                  : 'bg-[#F6F6FA] text-[#6B6B80] hover:text-[#0C0843]'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat === 'CONFLICT' ? 'Date Conflicts' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#6B6B80] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
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

      {/* Probation Tracker Table */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0C0843] text-white">
                <th className="px-3.5 py-3 font-semibold">Staff Code</th>
                <th className="px-3.5 py-3 font-semibold">Employee Name</th>
                <th className="px-3.5 py-3 font-semibold">Department</th>
                <th className="px-3.5 py-3 font-semibold">Job Role</th>
                <th className="px-3.5 py-3 font-semibold">Subsidiary</th>
                <th className="px-3.5 py-3 font-semibold">Start Date</th>
                <th className="px-3.5 py-3 font-semibold">End Date</th>
                <th className="px-3.5 py-3 font-semibold">Days Remaining</th>
                <th className="px-3.5 py-3 font-semibold">Probation Status</th>
                <th className="px-3.5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E5ED]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[#6B6B80]">
                    No probation records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((emp) => {
                  const hasProbConflict = emp.conflictReasons.some((r) =>
                    r.toLowerCase().includes('probation')
                  );
                  return (
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
                        {hasProbConflict && (
                          <span
                            title={emp.conflictReasons.join('; ')}
                            className="ml-1.5 inline-flex items-center gap-1 text-[10px] text-[#991B1B]"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Conflict
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
                        {formatDisplayDate(emp.probationStartIso, emp.probationStartRaw, dateFormat)}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono tabular-nums text-[#6B6B80] whitespace-nowrap">
                        {formatDisplayDate(emp.probationEndIso, emp.probationEndRaw, dateFormat)}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono tabular-nums font-semibold whitespace-nowrap">
                        {emp.probationCategory === 'Completed' ? (
                          <span className="text-[#166534]">Completed</span>
                        ) : emp.probationDaysRemaining === null ? (
                          <span className="text-[#6B6B80]">N/A</span>
                        ) : emp.probationDaysRemaining < 0 ? (
                          <span className="text-[#DC2626]">
                            {Math.abs(emp.probationDaysRemaining)}d overdue
                          </span>
                        ) : (
                          <span className="text-[#0C0843]">{emp.probationDaysRemaining}d left</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <ProbationStatusLabel category={emp.probationCategory} />
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        {perms.canManageProbationConfirmation ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmp(emp);
                              setNextProbStatus(emp.probationStatus || 'Completed');
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Probation Outcome Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-[#0C0843]/55 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E5ED] rounded-xl max-w-md w-full p-6 shadow-lg">
            <h3 className="font-display text-base font-bold text-[#0C0843] mb-1">
              Update Probation Outcome
            </h3>
            <p className="text-xs text-[#6B6B80] mb-4">
              {editingEmp.fullName} ({editingEmp.staffCode}) · Ends{' '}
              {formatDisplayDate(
                editingEmp.probationEndIso,
                editingEmp.probationEndRaw,
                dateFormat
              )}
            </p>
            <label className="block text-xs font-medium text-[#6B6B80] mb-1">
              Recorded Probation Status
            </label>
            <select
              value={nextProbStatus}
              onChange={(e) => setNextProbStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg mb-5"
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Extended">Extended</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingEmp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6B80] bg-white border border-[#E6E5ED] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveOutcome}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Updating...' : 'Save Outcome'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
