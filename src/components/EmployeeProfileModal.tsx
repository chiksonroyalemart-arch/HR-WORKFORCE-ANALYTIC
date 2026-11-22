import React, { useState } from 'react';
import { X, Edit3, Save, Trash2, Printer, AlertTriangle } from 'lucide-react';
import {
  DateFormatOption,
  EmployeeComputed,
  EmployeeRecord,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types/hr';
import { formatDisplayDate, parseFlexibleDate } from '../utils/dateAndCsv';
import { BrandLogo } from './BrandLogo';
import { ConfirmationStatusLabel, ProbationStatusLabel } from './StatusIndicator';

interface EmployeeProfileModalProps {
  employee: EmployeeComputed;
  dateFormat: DateFormatOption;
  userRole: UserRole;
  logoUrl?: string;
  onClose: () => void;
  onSave: (updated: EmployeeRecord) => Promise<void>;
  onDelete: (employeeId: string) => Promise<void>;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  dateFormat,
  userRole,
  logoUrl,
  onClose,
  onSave,
  onDelete,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<EmployeeRecord>({ ...employee });

  const isOfficerOnly = userRole === 'hr_officer';

  const handleField = (key: keyof EmployeeRecord, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dobParsed = parseFlexibleDate(form.dobIso || form.dobRaw);
      const resParsed = parseFlexibleDate(form.resumptionDateIso || form.resumptionDateRaw);
      const pStartParsed = parseFlexibleDate(form.probationStartIso || form.probationStartRaw);
      const pEndParsed = parseFlexibleDate(form.probationEndIso || form.probationEndRaw);
      const confParsed = parseFlexibleDate(form.confirmationDateIso || form.confirmationDateRaw);

      const recomputedFullName =
        form.fullName.trim() ||
        [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').trim();

      await onSave({
        ...form,
        fullName: recomputedFullName || form.staffCode,
        dobRaw: dobParsed.raw,
        dobIso: dobParsed.iso,
        resumptionDateRaw: resParsed.raw,
        resumptionDateIso: resParsed.iso,
        probationStartRaw: pStartParsed.raw,
        probationStartIso: pStartParsed.iso,
        probationEndRaw: pEndParsed.raw,
        probationEndIso: pEndParsed.iso,
        confirmationDateRaw: confParsed.raw,
        confirmationDateIso: confParsed.iso,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const maskPii = (val: string) => {
    if (!val) return 'Not Supplied';
    if (perms.canViewSensitiveContactPII) return val;
    return 'Restricted (Management View)';
  };

  const renderField = (
    label: string,
    displayValue: string,
    fieldKey: keyof EmployeeRecord,
    type: 'text' | 'date' = 'text',
    editableForOfficer = false
  ) => {
    const canEditThisField = isEditing && (!isOfficerOnly || editableForOfficer);
    return (
      <div>
        <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">{label}</label>
        {canEditThisField ? (
          <input
            type={type}
            value={String(form[fieldKey] ?? '')}
            onChange={(e) => handleField(fieldKey, e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B] focus:outline-none focus:border-[#0C0843]"
          />
        ) : (
          <p className="text-sm font-medium text-[#17172B]">{displayValue || 'Not Supplied'}</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0843]/55 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E6E5ED] rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0C0843] text-white rounded-t-xl flex items-center justify-between gap-4 border-b-2 border-[#D2A946]">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo logoUrl={logoUrl} size="md" variant="dark" />
            <div className="min-w-0">
              <p className="text-xs text-[#E5C66F] font-mono">{employee.staffCode}</p>
              <h2 className="font-display text-lg font-bold truncate">{employee.fullName}</h2>
              <p className="text-xs text-[#EDECF5]/80 truncate">
                {employee.jobRole} · {employee.department} · {employee.location}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 no-print cursor-pointer"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Conflicts Alert */}
          {employee.conflictReasons.length > 0 && (
            <div className="p-4 rounded-lg bg-[#FBF6E9] border border-[#D2A946] text-xs text-[#17172B]">
              <p className="font-semibold text-[#0C0843] flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-[#D2A946]" />
                HR Audit Flags ({employee.conflictReasons.length})
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[#6B6B80]">
                {employee.conflictReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section A: Personal Information */}
          <section>
            <h3 className="font-display text-sm font-bold text-[#0C0843] pb-2 mb-3 border-b border-[#E6E5ED]">
              A. Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {renderField('Staff Code', employee.staffCode, 'staffCode')}
              {renderField('Title', employee.title, 'title')}
              {renderField('Full Name', employee.fullName, 'fullName')}
              {renderField('First Name', employee.firstName, 'firstName')}
              {renderField('Middle Name', employee.middleName, 'middleName')}
              {renderField('Last Name', employee.lastName, 'lastName')}
              {renderField('Gender', employee.gender, 'gender')}
              {renderField(
                'Date of Birth',
                `${formatDisplayDate(employee.dobIso, employee.dobRaw, dateFormat)}${
                  employee.ageValid && employee.age !== null ? ` (${employee.age} yrs)` : ''
                }`,
                'dobIso',
                'date'
              )}
              {renderField('Marital Status', employee.maritalStatus, 'maritalStatus', 'text', true)}
            </div>
          </section>

          {/* Section B: Employment Information */}
          <section>
            <h3 className="font-display text-sm font-bold text-[#0C0843] pb-2 mb-3 border-b border-[#E6E5ED]">
              B. Employment Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {renderField('Department', employee.department, 'department')}
              {renderField('Job Role', employee.jobRole, 'jobRole')}
              {renderField('Subsidiary', employee.subsidiary, 'subsidiary')}
              {renderField('Location', employee.location, 'location')}
              {renderField(
                'Resumption Date (Current Job Role)',
                `${formatDisplayDate(
                  employee.resumptionDateIso,
                  employee.resumptionDateRaw,
                  dateFormat
                )} · Tenure: ${employee.tenureLabel}`,
                'resumptionDateIso',
                'date'
              )}
            </div>
          </section>

          {/* Section C: Contact Information */}
          <section>
            <h3 className="font-display text-sm font-bold text-[#0C0843] pb-2 mb-3 border-b border-[#E6E5ED]">
              C. Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {renderField('Official Email', employee.officialEmail, 'officialEmail', 'text', true)}
              {renderField(
                'Personal Email',
                maskPii(employee.personalEmail),
                'personalEmail',
                'text',
                true
              )}
              {renderField(
                'Mobile Number',
                maskPii(employee.mobileNumber),
                'mobileNumber',
                'text',
                true
              )}
            </div>
          </section>

          {/* Section D: Probation Information */}
          <section>
            <h3 className="font-display text-sm font-bold text-[#0C0843] pb-2 mb-3 border-b border-[#E6E5ED]">
              D. Probation Information (6 Months Current Position)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
              {renderField('Probation Required', employee.probationRequired, 'probationRequired')}
              {renderField(
                'Probation Start Date',
                formatDisplayDate(employee.probationStartIso, employee.probationStartRaw, dateFormat),
                'probationStartIso',
                'date'
              )}
              {renderField(
                'Probation End Date',
                formatDisplayDate(employee.probationEndIso, employee.probationEndRaw, dateFormat),
                'probationEndIso',
                'date'
              )}
              <div>
                <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">
                  Probation Status
                </label>
                {isEditing ? (
                  <select
                    value={form.probationStatus}
                    onChange={(e) => handleField('probationStatus', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Extended">Extended</option>
                    <option value="Not Required">Not Required</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <ProbationStatusLabel category={employee.probationCategory} />
                    <p className="text-[11px] text-[#6B6B80]">
                      Recorded: {employee.probationStatus || 'Not Supplied'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section E: Confirmation Information */}
          <section>
            <h3 className="font-display text-sm font-bold text-[#0C0843] pb-2 mb-3 border-b border-[#E6E5ED]">
              E. Confirmation Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {renderField(
                'Confirmation Date (Current Position)',
                formatDisplayDate(
                  employee.confirmationDateIso,
                  employee.confirmationDateRaw,
                  dateFormat
                ),
                'confirmationDateIso',
                'date',
                true
              )}
              <div>
                <label className="block text-[11px] font-medium text-[#6B6B80] mb-1">
                  Confirmation Status
                </label>
                {isEditing ? (
                  <select
                    value={form.confirmationStatus}
                    onChange={(e) => handleField('confirmationStatus', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Deferred">Deferred</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <ConfirmationStatusLabel category={employee.confirmationCategory} />
                    <p className="text-[11px] text-[#6B6B80]">
                      Recorded: {employee.confirmationStatus || 'Not Supplied'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F6F6FA] border-t border-[#E6E5ED] rounded-b-xl flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            {perms.canAddDeleteEmployees && !isEditing && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#991B1B] bg-[#FEE2E2] rounded-lg hover:bg-[#FECACA] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Employee
              </button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#991B1B]">Confirm permanent delete?</span>
                <button
                  type="button"
                  onClick={() => onDelete(employee.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#DC2626] text-white rounded-lg cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E6E5ED] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0C0843] bg-white border border-[#E6E5ED] rounded-lg hover:bg-[#EDECF5] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Profile
            </button>

            {perms.canEditEmployees && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#D2A946]" />
                Edit Employee
              </button>
            )}

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...employee });
                    setIsEditing(false);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-[#6B6B80] bg-white border border-[#E6E5ED] rounded-lg hover:bg-[#F6F6FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0C0843] bg-[#D2A946] rounded-lg hover:bg-[#E5C66F] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
