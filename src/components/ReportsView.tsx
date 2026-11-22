import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import {
  DataQualityIssue,
  DateFormatOption,
  EmployeeComputed,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types/hr';
import { countByField } from '../utils/analyticsAndAlerts';
import { formatDisplayDate } from '../utils/dateAndCsv';
import { exportReportToPdf, exportRowsToCsv, exportRowsToExcel } from '../utils/exports';
import { BrandLogo } from './BrandLogo';

interface ReportsViewProps {
  employees: EmployeeComputed[];
  dataQualityIssues: DataQualityIssue[];
  dateFormat: DateFormatOption;
  userRole: UserRole;
  logoUrl?: string;
}

type ReportId =
  | 'master'
  | 'departmental'
  | 'subsidiary'
  | 'demographics'
  | 'age'
  | 'tenure'
  | 'probation'
  | 'confirmation'
  | 'birthdays'
  | 'data_quality'
  | 'missing_info'
  | 'headcount';

const REPORTS: { id: ReportId; title: string; description: string }[] = [
  { id: 'master', title: '1. Employee Master List', description: 'Complete directory with roles, locations, dates, and statuses.' },
  { id: 'departmental', title: '2. Departmental Employee Report', description: 'Headcount, gender split, and confirmation rates per department.' },
  { id: 'subsidiary', title: '3. Subsidiary Employee Report', description: 'Breakdown of personnel across corporate subsidiaries.' },
  { id: 'demographics', title: '4. Employee Demographics Report', description: 'Gender and marital status cross-tabulation by department.' },
  { id: 'age', title: '5. Employee Age Report', description: 'Dynamic age calculated from DOB with validity flags.' },
  { id: 'tenure', title: '6. Employee Tenure Report', description: 'Current job role tenure measured from resumption date.' },
  { id: 'probation', title: '7. Probation Monitoring Report', description: '6-month probation milestones, days remaining, and conflicts.' },
  { id: 'confirmation', title: '8. Confirmation Monitoring Report', description: 'Confirmation dates, pending cases, and status discrepancies.' },
  { id: 'birthdays', title: '9. Upcoming Birthdays Report', description: 'Staff celebrating birthdays within the next 30 days.' },
  { id: 'data_quality', title: '10. Employee Data Quality Report', description: 'Audit of duplicates, #REF! codes, invalid dates, and typos.' },
  { id: 'missing_info', title: '11. Missing Information Report', description: 'Employees with missing contact or core HR profile fields.' },
  { id: 'headcount', title: '12. Workforce Headcount Report', description: 'Summary matrix by location and department.' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  employees,
  dataQualityIssues,
  dateFormat,
  userRole,
  logoUrl,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [selectedReport, setSelectedReport] = useState<ReportId>('master');

  const reportData = useMemo((): {
    title: string;
    subtitle: string;
    columns: string[];
    rows: (string | number)[][];
  } => {
    switch (selectedReport) {
      case 'master':
        return {
          title: 'Employee Master List',
          subtitle: `${employees.length} active employee records`,
          columns: ['Staff Code', 'Full Name', 'Department', 'Job Role', 'Location', 'Resumption', 'Probation', 'Confirmation'],
          rows: employees.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            e.jobRole,
            e.location,
            formatDisplayDate(e.resumptionDateIso, e.resumptionDateRaw, dateFormat),
            e.probationCategory,
            e.confirmationCategory,
          ]),
        };

      case 'departmental': {
        const depts = countByField(employees, (e) => e.department);
        return {
          title: 'Departmental Employee Report',
          subtitle: `${depts.length} departments across ${employees.length} staff`,
          columns: ['Department', 'Headcount', 'Share %', 'Male', 'Female', 'Confirmed', 'On Probation'],
          rows: depts.map((d) => {
            const list = employees.filter((e) => (e.department || 'Unspecified') === d.name);
            return [
              d.name,
              d.count,
              `${d.percentage}%`,
              list.filter((e) => e.gender.toLowerCase() === 'male').length,
              list.filter((e) => e.gender.toLowerCase() === 'female').length,
              list.filter((e) => e.confirmationCategory === 'Confirmed').length,
              list.filter((e) => ['In Progress', 'Approaching Deadline', 'Due Within 7 Days', 'Overdue'].includes(e.probationCategory)).length,
            ];
          }),
        };
      }

      case 'subsidiary': {
        const subs = countByField(employees, (e) => e.subsidiary);
        return {
          title: 'Subsidiary Employee Report',
          subtitle: `${subs.length} subsidiaries`,
          columns: ['Subsidiary', 'Headcount', 'Share %', 'Departments', 'Locations', 'Confirmed'],
          rows: subs.map((s) => {
            const list = employees.filter((e) => (e.subsidiary || 'Unspecified') === s.name);
            return [
              s.name,
              s.count,
              `${s.percentage}%`,
              new Set(list.map((e) => e.department).filter(Boolean)).size,
              new Set(list.map((e) => e.location).filter(Boolean)).size,
              list.filter((e) => e.confirmationCategory === 'Confirmed').length,
            ];
          }),
        };
      }

      case 'demographics':
        return {
          title: 'Employee Demographics Report',
          subtitle: 'Gender and marital status profile',
          columns: ['Staff Code', 'Full Name', 'Department', 'Gender', 'Marital Status', 'Location'],
          rows: employees.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            e.gender || 'Unspecified',
            e.maritalStatus || 'Unspecified',
            e.location,
          ]),
        };

      case 'age':
        return {
          title: 'Employee Age Report',
          subtitle: 'Calculated dynamically from Date of Birth',
          columns: ['Staff Code', 'Full Name', 'Department', 'Date of Birth', 'Calculated Age', 'Validity'],
          rows: employees.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            formatDisplayDate(e.dobIso, e.dobRaw, dateFormat),
            e.age !== null ? e.age : 'N/A',
            e.ageValid ? 'Valid' : 'Review Required',
          ]),
        };

      case 'tenure':
        return {
          title: 'Employee Current-Role Tenure Report',
          subtitle: 'Duration in current job role from Resumption Date',
          columns: ['Staff Code', 'Full Name', 'Department', 'Job Role', 'Resumption Date', 'Current-Role Tenure'],
          rows: employees.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            e.jobRole,
            formatDisplayDate(e.resumptionDateIso, e.resumptionDateRaw, dateFormat),
            e.tenureLabel,
          ]),
        };

      case 'probation':
        return {
          title: 'Probation Monitoring Report',
          subtitle: '6-month current position probation schedule',
          columns: ['Staff Code', 'Full Name', 'Department', 'Start Date', 'End Date', 'Days Left', 'Status'],
          rows: employees.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            formatDisplayDate(e.probationStartIso, e.probationStartRaw, dateFormat),
            formatDisplayDate(e.probationEndIso, e.probationEndRaw, dateFormat),
            e.probationDaysRemaining ?? 'N/A',
            e.probationCategory,
          ]),
        };

      case 'confirmation':
        return {
          title: 'Confirmation Monitoring Report',
          subtitle: 'Employee confirmation tracking and discrepancy review',
          columns: ['Staff Code', 'Full Name', 'Department', 'Probation End', 'Confirmation Date', 'Recorded Status', 'Computed State'],
          rows: employees.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            formatDisplayDate(e.probationEndIso, e.probationEndRaw, dateFormat),
            formatDisplayDate(e.confirmationDateIso, e.confirmationDateRaw, dateFormat),
            e.confirmationStatus || 'Pending',
            e.confirmationCategory,
          ]),
        };

      case 'birthdays': {
        const list = employees
          .filter((e) => e.daysUntilBirthday !== null && e.daysUntilBirthday <= 30)
          .sort((a, b) => (a.daysUntilBirthday ?? 99) - (b.daysUntilBirthday ?? 99));
        return {
          title: 'Upcoming Birthdays Report (Next 30 Days)',
          subtitle: `${list.length} employee birthdays in the next 30 days`,
          columns: ['Staff Code', 'Full Name', 'Department', 'Location', 'Date of Birth', 'Days Until Birthday'],
          rows: list.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            e.location,
            formatDisplayDate(e.dobIso, e.dobRaw, dateFormat),
            e.daysUntilBirthday === 0 ? 'Today' : `${e.daysUntilBirthday} days`,
          ]),
        };
      }

      case 'data_quality':
        return {
          title: 'Employee Data Quality Report',
          subtitle: `${dataQualityIssues.length} audit findings across dataset`,
          columns: ['Staff Code', 'Full Name', 'Department', 'Issue Type', 'Severity', 'Description'],
          rows: dataQualityIssues.map((d) => [
            d.staffCode,
            d.fullName,
            d.department,
            d.issueType,
            d.severity,
            d.description,
          ]),
        };

      case 'missing_info': {
        const list = employees.filter((e) => e.missingFields.length > 0);
        return {
          title: 'Missing Information Report',
          subtitle: `${list.length} employees with incomplete contact or profile fields`,
          columns: ['Staff Code', 'Full Name', 'Department', 'Location', 'Missing Fields Count', 'Missing Fields'],
          rows: list.map((e) => [
            e.staffCode,
            e.fullName,
            e.department,
            e.location,
            e.missingFields.length,
            e.missingFields.join(', '),
          ]),
        };
      }

      case 'headcount': {
        const locs = countByField(employees, (e) => e.location);
        return {
          title: 'Workforce Headcount Report by Location',
          subtitle: `${locs.length} active locations`,
          columns: ['Location', 'Total Headcount', 'Share %', 'Male', 'Female', 'Confirmed'],
          rows: locs.map((l) => {
            const list = employees.filter((e) => (e.location || 'Unspecified') === l.name);
            return [
              l.name,
              l.count,
              `${l.percentage}%`,
              list.filter((e) => e.gender.toLowerCase() === 'male').length,
              list.filter((e) => e.gender.toLowerCase() === 'female').length,
              list.filter((e) => e.confirmationCategory === 'Confirmed').length,
            ];
          }),
        };
      }
    }
  }, [selectedReport, employees, dataQualityIssues, dateFormat]);

  const toObjectRows = () =>
    reportData.rows.map((r) => {
      const obj: Record<string, string | number> = {};
      reportData.columns.forEach((col, i) => {
        obj[col] = r[i];
      });
      return obj;
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Report Selector List */}
      <div className="lg:col-span-4 bg-white border border-[#E6E5ED] rounded-xl p-4 space-y-1.5 no-print h-fit">
        <h2 className="font-display text-sm font-bold text-[#0C0843] px-2 pb-2 border-b border-[#E6E5ED]">
          Select Enterprise HR Report
        </h2>
        {REPORTS.map((r) => {
          const active = selectedReport === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedReport(r.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                active ? 'bg-[#0C0843] text-white' : 'hover:bg-[#F6F6FA] text-[#17172B]'
              }`}
            >
              <p className={`text-xs font-semibold ${active ? 'text-[#E5C66F]' : 'text-[#0C0843]'}`}>
                {r.title}
              </p>
              <p className={`text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-[#6B6B80]'}`}>
                {r.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Report Preview & Export Panel */}
      <div className="lg:col-span-8 space-y-4">
        {/* Branded Report Header */}
        <div className="bg-white border border-[#E6E5ED] rounded-xl overflow-hidden">
          <div className="bg-[#0C0843] text-white px-6 py-4 border-b-2 border-[#D2A946] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo logoUrl={logoUrl} size="md" variant="dark" />
              <div>
                <p className="text-xs text-[#E5C66F] font-semibold">
                  ALERT MFB — Human Resources Report
                </p>
                <h2 className="font-display text-base font-bold">{reportData.title}</h2>
                <p className="text-xs text-white/75">{reportData.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 no-print">
              {perms.canImportExport && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      exportRowsToExcel(
                        toObjectRows(),
                        reportData.title.slice(0, 28),
                        `ALERT_MFB_${selectedReport}_report`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#D2A946] text-[#0C0843] rounded-lg hover:bg-[#E5C66F] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Excel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportRowsToCsv(toObjectRows(), `ALERT_MFB_${selectedReport}_report`)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/15 text-white rounded-lg hover:bg-white/25 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportReportToPdf({
                        title: reportData.title,
                        subtitle: reportData.subtitle,
                        columns: reportData.columns,
                        rows: reportData.rows,
                        fileName: `ALERT_MFB_${selectedReport}_report`,
                        logoUrl,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-[#0C0843] rounded-lg hover:bg-[#EDECF5] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/15 text-white rounded-lg hover:bg-white/25 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#F6F6FA] border-b border-[#E6E5ED]">
                <tr>
                  {reportData.columns.map((c) => (
                    <th key={c} className="px-3.5 py-2.5 font-semibold text-[#0C0843] whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E5ED]">
                {reportData.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={reportData.columns.length}
                      className="px-6 py-10 text-center text-[#6B6B80]"
                    >
                      No records match this report criteria.
                    </td>
                  </tr>
                ) : (
                  reportData.rows.slice(0, 200).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FBF6E9]/40">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3.5 py-2 text-[#17172B] whitespace-nowrap font-mono sm:font-sans tabular-nums">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {reportData.rows.length > 200 && (
            <div className="px-4 py-2.5 bg-[#F6F6FA] border-t border-[#E6E5ED] text-[11px] text-[#6B6B80]">
              Previewing first 200 of {reportData.rows.length} rows. Full dataset is included in
              Excel, CSV, and PDF exports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
