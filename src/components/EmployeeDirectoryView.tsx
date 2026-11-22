import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  UserCheck,
} from 'lucide-react';
import { DateFormatOption, EmployeeComputed, ROLE_PERMISSIONS, UserRole } from '../types/hr';
import { formatDisplayDate } from '../utils/dateAndCsv';
import { exportRowsToCsv, exportRowsToExcel } from '../utils/exports';
import { ConfirmationStatusLabel, ProbationStatusLabel } from './StatusIndicator';

interface EmployeeDirectoryViewProps {
  employees: EmployeeComputed[];
  dateFormat: DateFormatOption;
  userRole: UserRole;
  onSelectEmployee: (emp: EmployeeComputed) => void;
  onOpenAddEmployee: () => void;
}

type SortKey =
  | 'staffCode'
  | 'fullName'
  | 'department'
  | 'jobRole'
  | 'location'
  | 'resumptionDateIso'
  | 'probationCategory'
  | 'confirmationCategory';

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  dateFormat,
  userRole,
  onSelectEmployee,
  onOpenAddEmployee,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [localSearch, setLocalSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('staffCode');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const searched = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.staffCode} ${e.fullName} ${e.department} ${e.jobRole} ${e.location}`
        .toLowerCase()
        .includes(q)
    );
  }, [employees, localSearch]);

  const sorted = useMemo(() => {
    const copy = [...searched];
    copy.sort((a, b) => {
      const av = String(a[sortKey] || '');
      const bv = String(b[sortKey] || '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return copy;
  }, [searched, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const buildExportRows = () =>
    sorted.map((e, i) => ({
      'S/N': e.sn ?? i + 1,
      'Staff Code': e.staffCode,
      'Full Name': e.fullName,
      Department: e.department,
      'Job Role': e.jobRole,
      Subsidiary: e.subsidiary,
      Gender: e.gender,
      'Date of Birth': formatDisplayDate(e.dobIso, e.dobRaw, dateFormat),
      'Official Email': e.officialEmail || 'Not Supplied',
      'Mobile Number': perms.canViewSensitiveContactPII
        ? e.mobileNumber || 'Not Supplied'
        : 'Restricted',
      Location: e.location,
      'Resumption Date': formatDisplayDate(e.resumptionDateIso, e.resumptionDateRaw, dateFormat),
      'Probation Status': e.probationCategory,
      'Confirmation Status': e.confirmationCategory,
    }));

  const SortButton: React.FC<{ label: string; col: SortKey }> = ({ label, col }) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-1 font-semibold text-left hover:text-[#D2A946] cursor-pointer whitespace-nowrap"
    >
      <span>{label}</span>
      <ArrowUpDown className="w-3 h-3 opacity-60" />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-[#6B6B80] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filter directory by name or staff code..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg focus:outline-none focus:border-[#0C0843]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#6B6B80] font-mono tabular-nums mr-2">
            {sorted.length} employees
          </span>
          {perms.canImportExport && (
            <>
              <button
                type="button"
                onClick={() => exportRowsToCsv(buildExportRows(), 'ALERT_MFB_Employee_Directory')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0C0843] bg-white border border-[#E6E5ED] rounded-lg hover:bg-[#EDECF5] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  exportRowsToExcel(
                    buildExportRows(),
                    'Employees',
                    'ALERT_MFB_Employee_Directory'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946]/60 rounded-lg hover:bg-[#F5E8C5] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#8C6812]" />
                Excel
              </button>
            </>
          )}
          {perms.canAddDeleteEmployees && (
            <button
              type="button"
              onClick={onOpenAddEmployee}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D2A946]" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0C0843] text-white text-xs">
                <th className="px-3.5 py-3">
                  <SortButton label="Staff Code" col="staffCode" />
                </th>
                <th className="px-3.5 py-3">
                  <SortButton label="Full Name" col="fullName" />
                </th>
                <th className="px-3.5 py-3">
                  <SortButton label="Department" col="department" />
                </th>
                <th className="px-3.5 py-3">
                  <SortButton label="Job Role" col="jobRole" />
                </th>
                <th className="px-3.5 py-3 whitespace-nowrap">Subsidiary</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Gender</th>
                <th className="px-3.5 py-3 whitespace-nowrap">DOB</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Official Email</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Mobile</th>
                <th className="px-3.5 py-3">
                  <SortButton label="Location" col="location" />
                </th>
                <th className="px-3.5 py-3">
                  <SortButton label="Resumption" col="resumptionDateIso" />
                </th>
                <th className="px-3.5 py-3">
                  <SortButton label="Probation" col="probationCategory" />
                </th>
                <th className="px-3.5 py-3">
                  <SortButton label="Confirmation" col="confirmationCategory" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E5ED] text-xs">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-[#6B6B80]">
                    No employee records match your current search and global filters.
                  </td>
                </tr>
              ) : (
                paginated.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="hover:bg-[#FBF6E9]/60 transition-colors cursor-pointer"
                  >
                    <td className="px-3.5 py-2.5 font-mono text-[#0C0843] font-medium whitespace-nowrap">
                      {emp.staffCode}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-[#17172B] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        {emp.fullName}
                        {emp.hasConflict && (
                          <span
                            title={emp.conflictReasons.join('; ')}
                            className="text-[10px] font-mono text-[#991B1B]"
                          >
                            [Flag]
                          </span>
                        )}
                      </span>
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
                    <td className="px-3.5 py-2.5 text-[#6B6B80] whitespace-nowrap">
                      {emp.gender}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono tabular-nums text-[#6B6B80] whitespace-nowrap">
                      {formatDisplayDate(emp.dobIso, emp.dobRaw, dateFormat)}
                    </td>
                    <td className="px-3.5 py-2.5 text-[#6B6B80] whitespace-nowrap">
                      {emp.officialEmail || '—'}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[#6B6B80] whitespace-nowrap">
                      {perms.canViewSensitiveContactPII ? emp.mobileNumber || '—' : 'Restricted'}
                    </td>
                    <td className="px-3.5 py-2.5 text-[#17172B] whitespace-nowrap">
                      {emp.location}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono tabular-nums text-[#6B6B80] whitespace-nowrap">
                      {formatDisplayDate(emp.resumptionDateIso, emp.resumptionDateRaw, dateFormat)}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <ProbationStatusLabel category={emp.probationCategory} />
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <ConfirmationStatusLabel category={emp.confirmationCategory} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-[#F6F6FA] border-t border-[#E6E5ED] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6B80]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-[#0C0843]" />
            <span>Click any row to open full 5-section Employee Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-white border border-[#E6E5ED] rounded text-xs"
            >
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <span className="font-mono tabular-nums">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-[#E6E5ED] bg-white disabled:opacity-40 cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-[#E6E5ED] bg-white disabled:opacity-40 cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
