import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileUp,
  Sparkles,
} from 'lucide-react';
import {
  DataQualityIssue,
  EmployeeComputed,
  EmployeeRecord,
  ImportAuditLog,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types/hr';
import { parseSpreadsheetFileToEmployees } from '../utils/dateAndCsv';
import { exportRowsToExcel } from '../utils/exports';

interface DataManagementViewProps {
  employees: EmployeeComputed[];
  dataQualityIssues: DataQualityIssue[];
  importLogs: ImportAuditLog[];
  userRole: UserRole;
  actorUid: string;
  onApplyImport: (options: {
    fileName: string;
    newRecords: EmployeeRecord[];
    updatedRecords: EmployeeRecord[];
    duplicateCount: number;
    skippedCount: number;
  }) => Promise<void>;
  onBatchStandardize: (updatedRecords: EmployeeRecord[]) => Promise<void>;
  onSelectEmployee: (emp: EmployeeComputed) => void;
}

interface ImportPreview {
  fileName: string;
  totalRows: number;
  newRecords: EmployeeRecord[];
  matchedUpdates: { existing: EmployeeRecord; incoming: EmployeeRecord }[];
  duplicatesInFile: string[];
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  employees,
  dataQualityIssues,
  importLogs,
  userRole,
  actorUid,
  onApplyImport,
  onBatchStandardize,
  onSelectEmployee,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [preserveBlankFields, setPreserveBlankFields] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [issueFilter, setIssueFilter] = useState<string>('ALL');

  const namingFixesAvailable = useMemo(
    () =>
      employees.filter(
        (e) => e.department.toLowerCase() === 'marketting' || e.location === 'kaduna'
      ),
    [employees]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMessage(null);

    const parsed = await parseSpreadsheetFileToEmployees(file, [actorUid], actorUid);
    const seenCodes = new Set<string>();
    const duplicatesInFile: string[] = [];
    const existingByCode = new Map<string, EmployeeRecord>();
    employees.forEach((emp) => {
      existingByCode.set(emp.staffCode.trim().toUpperCase(), emp);
    });

    const newRecords: EmployeeRecord[] = [];
    const matchedUpdates: { existing: EmployeeRecord; incoming: EmployeeRecord }[] = [];

    parsed.forEach((rec) => {
      const codeKey = rec.staffCode.trim().toUpperCase();
      if (seenCodes.has(codeKey)) {
        duplicatesInFile.push(rec.staffCode);
      } else {
        seenCodes.add(codeKey);
      }

      const existing = existingByCode.get(codeKey);
      if (existing) {
        matchedUpdates.push({ existing, incoming: rec });
      } else {
        newRecords.push(rec);
      }
    });

    setPreview({
      fileName: file.name,
      totalRows: parsed.length,
      newRecords,
      matchedUpdates,
      duplicatesInFile,
    });
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const mergedUpdates: EmployeeRecord[] = preview.matchedUpdates.map(({ existing, incoming }) => {
        const pick = (inc: string, ex: string) =>
          preserveBlankFields ? (inc ? inc : ex) : inc;
        return {
          ...existing,
          sn: incoming.sn ?? existing.sn,
          title: pick(incoming.title, existing.title),
          firstName: pick(incoming.firstName, existing.firstName),
          middleName: pick(incoming.middleName, existing.middleName),
          lastName: pick(incoming.lastName, existing.lastName),
          fullName: pick(incoming.fullName, existing.fullName),
          department: pick(incoming.department, existing.department),
          jobRole: pick(incoming.jobRole, existing.jobRole),
          subsidiary: pick(incoming.subsidiary, existing.subsidiary),
          dobRaw: pick(incoming.dobRaw, existing.dobRaw),
          dobIso: pick(incoming.dobIso, existing.dobIso),
          officialEmail: pick(incoming.officialEmail, existing.officialEmail),
          mobileNumber: pick(incoming.mobileNumber, existing.mobileNumber),
          personalEmail: pick(incoming.personalEmail, existing.personalEmail),
          gender: pick(incoming.gender, existing.gender),
          maritalStatus: pick(incoming.maritalStatus, existing.maritalStatus),
          location: pick(incoming.location, existing.location),
          resumptionDateRaw: pick(incoming.resumptionDateRaw, existing.resumptionDateRaw),
          resumptionDateIso: pick(incoming.resumptionDateIso, existing.resumptionDateIso),
          probationRequired: pick(incoming.probationRequired, existing.probationRequired),
          probationStartRaw: pick(incoming.probationStartRaw, existing.probationStartRaw),
          probationStartIso: pick(incoming.probationStartIso, existing.probationStartIso),
          probationEndRaw: pick(incoming.probationEndRaw, existing.probationEndRaw),
          probationEndIso: pick(incoming.probationEndIso, existing.probationEndIso),
          probationStatus: pick(incoming.probationStatus, existing.probationStatus),
          confirmationDateRaw: pick(incoming.confirmationDateRaw, existing.confirmationDateRaw),
          confirmationDateIso: pick(incoming.confirmationDateIso, existing.confirmationDateIso),
          confirmationStatus: pick(incoming.confirmationStatus, existing.confirmationStatus),
        };
      });

      await onApplyImport({
        fileName: preview.fileName,
        newRecords: preview.newRecords,
        updatedRecords: mergedUpdates,
        duplicateCount: preview.duplicatesInFile.length,
        skippedCount: 0,
      });
      setImportMessage(
        `Import completed: ${preview.newRecords.length} added, ${mergedUpdates.length} updated.`
      );
      setPreview(null);
    } finally {
      setImporting(false);
    }
  };

  const handleStandardizeNames = async () => {
    const fixed = namingFixesAvailable.map((e) => ({
      ...e,
      department: e.department.toLowerCase() === 'marketting' ? 'Marketing' : e.department,
      location: e.location === 'kaduna' ? 'Kaduna' : e.location,
    }));
    await onBatchStandardize(fixed);
  };

  const handleExportMaster = () => {
    const rows = employees.map((e, idx) => ({
      'S/N': e.sn ?? idx + 1,
      'STAFF CODE': e.staffCode,
      TITLE: e.title,
      'FIRST NAME': e.firstName,
      'MIDDLE NAME': e.middleName,
      'LAST NAME': e.lastName,
      'FULL NAME': e.fullName,
      DEPARTMENT: e.department,
      'JOB ROLE': e.jobRole,
      SUBSIDIARY: e.subsidiary,
      DOB: e.dobIso || e.dobRaw,
      'OFFICIAL EMAIL': e.officialEmail,
      'MOBILE NUMBER': e.mobileNumber,
      'PERSONAL EMAIL': e.personalEmail,
      GENDER: e.gender,
      'MARITAL STATUS': e.maritalStatus,
      LOCATION: e.location,
      'RESUMPTION DATE (CURRENT JOB ROLE)': e.resumptionDateIso || e.resumptionDateRaw,
      'PROBATION REQUIRED': e.probationRequired,
      'PROBATION START DATE': e.probationStartIso || e.probationStartRaw,
      'PROBATION END DATE': e.probationEndIso || e.probationEndRaw,
      'PROBATION STATUS': e.probationStatus,
      'CONFIRMATION DATE': e.confirmationDateIso || e.confirmationDateRaw,
      'CONFIRMATION STATUS': e.confirmationStatus,
    }));
    exportRowsToExcel(rows, 'Master Dataset', 'ALERT_MFB_Master_Dataset');
  };

  const filteredIssues = useMemo(() => {
    if (issueFilter === 'ALL') return dataQualityIssues;
    return dataQualityIssues.filter((i) => i.issueType === issueFilter);
  }, [dataQualityIssues, issueFilter]);

  return (
    <div className="space-y-6">
      {/* Import & Export Card */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#EDECF5] text-[#0C0843]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#0C0843]">
                Dataset Import, Matching &amp; Synchronization
              </h2>
              <p className="text-xs text-[#6B6B80]">
                Upload updated Excel (.xlsx/.xls) or CSV datasets. Records are matched by STAFF
                CODE and reviewed before overwriting.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {perms.canImportExport && (
              <>
                <button
                  type="button"
                  onClick={handleExportMaster}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946]/60 rounded-lg hover:bg-[#F5E8C5] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Master Excel
                </button>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] cursor-pointer">
                  <FileUp className="w-3.5 h-3.5 text-[#D2A946]" />
                  Import Excel / CSV
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {importMessage && (
          <div className="p-3 rounded-lg bg-[#DCFCE7] border border-[#86EFAC] text-xs text-[#166534] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importMessage}</span>
          </div>
        )}

        {/* Import Review Staging Panel */}
        {preview && (
          <div className="p-4 rounded-xl bg-[#FBF6E9] border border-[#D2A946] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-[#0C0843]">
                  Import Review: {preview.fileName}
                </h3>
                <p className="text-xs text-[#6B6B80]">
                  Parsed {preview.totalRows} valid rows · New: {preview.newRecords.length} ·
                  Matched Updates: {preview.matchedUpdates.length} · In-File Duplicates:{' '}
                  {preview.duplicatesInFile.length}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#0C0843] cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveBlankFields}
                  onChange={(e) => setPreserveBlankFields(e.target.checked)}
                />
                Preserve existing employee fields where uploaded file is blank
              </label>
            </div>

            {preview.duplicatesInFile.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[#FEE2E2] text-xs text-[#991B1B]">
                Duplicate STAFF CODE(s) found inside uploaded file:{' '}
                <span className="font-mono">{preview.duplicatesInFile.join(', ')}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6B80] bg-white border border-[#E6E5ED] rounded-lg cursor-pointer"
              >
                Cancel Import
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleConfirmImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] disabled:opacity-60 cursor-pointer"
              >
                {importing ? 'Applying Import...' : 'Confirm & Commit Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Quality Auditor */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#E6E5ED] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#0C0843] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D2A946]" />
              Employee Data Quality Audit ({dataQualityIssues.length} Findings)
            </h2>
            <p className="text-xs text-[#6B6B80]">
              Automatically detects duplicate staff codes, #REF! errors, invalid DOBs, spelling
              inconsistencies, and missing fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {perms.canEditEmployees && namingFixesAvailable.length > 0 && (
              <button
                type="button"
                onClick={handleStandardizeNames}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946] rounded-lg hover:bg-[#F5E8C5] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C6812]" />
                Standardize {namingFixesAvailable.length} Dept/Location Typos
              </button>
            )}
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
            >
              <option value="ALL">All Issues ({dataQualityIssues.length})</option>
              <option value="Duplicate Staff Code">Duplicate Staff Code</option>
              <option value="Invalid Staff Code">Invalid Staff Code</option>
              <option value="Invalid Date">Invalid Date</option>
              <option value="Inconsistent Naming">Inconsistent Naming</option>
              <option value="Probation/Confirmation Conflict">Probation/Confirmation Conflict</option>
              <option value="Missing Information">Missing Information</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#0C0843] text-white">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Staff Code</th>
                <th className="px-4 py-2.5 font-semibold">Employee</th>
                <th className="px-4 py-2.5 font-semibold">Department</th>
                <th className="px-4 py-2.5 font-semibold">Issue Category</th>
                <th className="px-4 py-2.5 font-semibold">Severity</th>
                <th className="px-4 py-2.5 font-semibold">Finding Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E5ED]">
              {filteredIssues.slice(0, 150).map((issue) => {
                const emp = employees.find((e) => e.id === issue.employeeId);
                return (
                  <tr
                    key={issue.id}
                    onClick={() => emp && onSelectEmployee(emp)}
                    className="hover:bg-[#FBF6E9]/60 cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-mono text-[#0C0843] whitespace-nowrap">
                      {issue.staffCode}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#17172B] whitespace-nowrap">
                      {issue.fullName}
                    </td>
                    <td className="px-4 py-2.5 text-[#6B6B80] whitespace-nowrap">
                      {issue.department}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[#0C0843] whitespace-nowrap">
                      {issue.issueType}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          issue.severity === 'High'
                            ? 'bg-[#FEE2E2] text-[#991B1B]'
                            : issue.severity === 'Medium'
                            ? 'bg-[#FBF6E9] text-[#8C6812]'
                            : 'bg-[#F6F6FA] text-[#6B6B80]'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#17172B]">{issue.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Import History */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-5">
        <h3 className="font-display text-sm font-bold text-[#0C0843] mb-3">
          Dataset Import History
        </h3>
        {importLogs.length === 0 ? (
          <p className="text-xs text-[#6B6B80]">
            No external spreadsheet imports have been executed yet in this workspace.
          </p>
        ) : (
          <div className="divide-y divide-[#E6E5ED] text-xs">
            {importLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#0C0843]">{log.fileName}</span>
                  <span className="text-[#6B6B80]"> · Imported by {log.importedByEmail}</span>
                </div>
                <span className="font-mono tabular-nums text-[#0C0843]">
                  Added: {log.addedCount} · Updated: {log.updatedCount} · Duplicates:{' '}
                  {log.duplicateCount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
