import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { EmployeeRecord } from '../types/hr';
import { makeSafeDocId, parseFlexibleDate } from '../utils/dateAndCsv';

interface EmployeeFormModalProps {
  existingEmployees: EmployeeRecord[];
  onClose: () => void;
  onCreate: (employee: EmployeeRecord) => Promise<void>;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  existingEmployees,
  onClose,
  onCreate,
}) => {
  const [staffCode, setStaffCode] = useState('');
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('Marketing');
  const [jobRole, setJobRole] = useState('Loan Officer');
  const [subsidiary, setSubsidiary] = useState('Alert MFB');
  const [location, setLocation] = useState('HQ');
  const [gender, setGender] = useState('Male');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [dobIso, setDobIso] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [resumptionDateIso, setResumptionDateIso] = useState('');
  const [probationRequired, setProbationRequired] = useState('Yes');
  const [probationStartIso, setProbationStartIso] = useState('');
  const [probationEndIso, setProbationEndIso] = useState('');
  const [probationStatus, setProbationStatus] = useState('Pending');
  const [confirmationDateIso, setConfirmationDateIso] = useState('');
  const [confirmationStatus, setConfirmationStatus] = useState('Pending');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const duplicateExists =
    staffCode.trim() &&
    existingEmployees.some(
      (e) => e.staffCode.trim().toUpperCase() === staffCode.trim().toUpperCase()
    );

  const handleResumptionChange = (val: string) => {
    setResumptionDateIso(val);
    if (val && !probationStartIso) {
      setProbationStartIso(val);
      const d = new Date(`${val}T00:00:00Z`);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCMonth(d.getUTCMonth() + 6);
        const endIso = d.toISOString().slice(0, 10);
        setProbationEndIso(endIso);
        if (!confirmationDateIso) setConfirmationDateIso(endIso);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffCode.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Staff Code, First Name, and Last Name are required.');
      return;
    }
    if (duplicateExists) {
      setError(`Staff Code "${staffCode}" already exists. Use a unique Staff Code.`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
      const nextSn =
        existingEmployees.reduce((max, item) => Math.max(max, item.sn || 0), 0) + 1;
      const dob = parseFlexibleDate(dobIso);
      const res = parseFlexibleDate(resumptionDateIso);
      const pStart = parseFlexibleDate(probationStartIso);
      const pEnd = parseFlexibleDate(probationEndIso);
      const conf = parseFlexibleDate(confirmationDateIso);

      const newEmp: EmployeeRecord = {
        id: makeSafeDocId('emp', Date.now(), staffCode.trim()),
        orgId: 'alert_mfb',
        sn: nextSn,
        staffCode: staffCode.trim(),
        title,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        fullName,
        department: department.trim(),
        jobRole: jobRole.trim(),
        subsidiary: subsidiary.trim(),
        dobRaw: dob.raw,
        dobIso: dob.iso,
        officialEmail: officialEmail.trim(),
        mobileNumber: mobileNumber.trim(),
        personalEmail: personalEmail.trim(),
        gender,
        maritalStatus,
        location: location.trim(),
        resumptionDateRaw: res.raw,
        resumptionDateIso: res.iso,
        probationRequired,
        probationStartRaw: pStart.raw,
        probationStartIso: pStart.iso,
        probationEndRaw: pEnd.raw,
        probationEndIso: pEnd.iso,
        probationStatus,
        confirmationDateRaw: conf.raw,
        confirmationDateIso: conf.iso,
        confirmationStatus,
        authorizedUids: [],
        updatedBy: '',
      };

      await onCreate(newEmp);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0843]/55 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E6E5ED] rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-lg"
      >
        <div className="px-6 py-4 bg-[#0C0843] text-white rounded-t-xl flex items-center justify-between border-b-2 border-[#D2A946]">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-[#D2A946]" />
            <h2 className="font-display text-base font-bold">Add New ALERT MFB Employee</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Staff Code *</label>
              <input
                required
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                placeholder="e.g. ALM|JD|221126"
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg font-mono"
              />
              {duplicateExists && (
                <p className="text-[11px] text-[#DC2626] mt-1">Duplicate Staff Code detected</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Title</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Miss">Miss</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">First Name *</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Middle Name</label>
              <input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Last Name *</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Job Role</label>
              <input
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Subsidiary</label>
              <input
                value={subsidiary}
                onChange={(e) => setSubsidiary(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">Date of Birth</label>
              <input
                type="date"
                value={dobIso}
                onChange={(e) => setDobIso(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Marital Status
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widower">Widower</option>
                <option value="Seperated">Separated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Mobile Number
              </label>
              <input
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Personal Email
              </label>
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Resumption Date (Current Role)
              </label>
              <input
                type="date"
                value={resumptionDateIso}
                onChange={(e) => handleResumptionChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Probation Required
              </label>
              <select
                value={probationRequired}
                onChange={(e) => setProbationRequired(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Probation Start Date
              </label>
              <input
                type="date"
                value={probationStartIso}
                onChange={(e) => setProbationStartIso(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Probation End Date
              </label>
              <input
                type="date"
                value={probationEndIso}
                onChange={(e) => setProbationEndIso(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Probation Status
              </label>
              <select
                value={probationStatus}
                onChange={(e) => setProbationStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B80] mb-1">
                Confirmation Status
              </label>
              <select
                value={confirmationStatus}
                onChange={(e) => setConfirmationStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#F6F6FA] border-t border-[#E6E5ED] rounded-b-xl flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#6B6B80] bg-white border border-[#E6E5ED] rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Adding Employee...' : 'Create Employee Record'}
          </button>
        </div>
      </form>
    </div>
  );
};
