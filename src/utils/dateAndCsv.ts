import * as XLSX from 'xlsx';
import {
  ConfirmationCategory,
  DateFormatOption,
  EmployeeComputed,
  EmployeeRecord,
  ProbationCategory,
} from '../types/hr';

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIsoDate(year: number, monthIndex: number, day: number): string {
  if (year < 1920 || year > 2099 || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
    return '';
  }
  const probe = new Date(Date.UTC(year, monthIndex, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== monthIndex ||
    probe.getUTCDate() !== day
  ) {
    return '';
  }
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseFlexibleDate(value: unknown): { raw: string; iso: string; isInvalid: boolean } {
  if (value === null || value === undefined) {
    return { raw: '', iso: '', isInvalid: false };
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) {
      return { raw: '', iso: '', isInvalid: false };
    }
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y >= 1920) {
      const iso = toIsoDate(parsed.y, parsed.m - 1, parsed.d);
      return { raw: iso, iso, isInvalid: !iso };
    }
    return { raw: String(value), iso: '', isInvalid: true };
  }

  const raw = String(value).replace(/\s+/g, ' ').trim();
  if (!raw) {
    return { raw: '', iso: '', isInvalid: false };
  }
  if (/^0\s+january\s+1900$/i.test(raw)) {
    return { raw: '', iso: '', isInvalid: false };
  }

  // ISO YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const iso = toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return { raw, iso, isInvalid: !iso };
  }

  // "16 June 1980" or "14th/Aug/1990" or "14-Aug-1990"
  const textMatch = raw.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\/\-]+([A-Za-z]+)[\s\/\-]+(\d{4})$/i);
  if (textMatch) {
    const day = Number(textMatch[1]);
    const monthKey = textMatch[2].toLowerCase();
    const year = Number(textMatch[3]);
    const monthIdx = MONTH_MAP[monthKey];
    if (monthIdx !== undefined) {
      const iso = toIsoDate(year, monthIdx, day);
      return { raw, iso, isInvalid: !iso };
    }
    return { raw, iso: '', isInvalid: true };
  }

  // DD/MM/YYYY or DD /MM/YYYY or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
    let iso = toIsoDate(y, m - 1, d);
    if (!iso && m > 12 && d <= 12) {
      iso = toIsoDate(y, d - 1, m);
    }
    return { raw, iso, isInvalid: !iso };
  }

  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime()) && fallback.getFullYear() >= 1920) {
    const iso = toIsoDate(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
    return { raw, iso, isInvalid: !iso };
  }

  return { raw, iso: '', isInvalid: true };
}

export function formatDisplayDate(
  iso: string | undefined,
  raw: string | undefined,
  format: DateFormatOption
): string {
  if (!iso) {
    return raw ? `${raw} (Invalid)` : 'Not Supplied';
  }
  const [yStr, mStr, dStr] = iso.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return raw || 'Not Supplied';

  if (format === 'YYYY-MM-DD') return iso;
  if (format === 'DD/MM/YYYY') return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  return `${String(d).padStart(2, '0')} ${MONTH_SHORT[m - 1]} ${y}`;
}

export function isoToUtcDate(iso: string): Date | null {
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

export function diffDaysUtc(targetIso: string, referenceDate: Date): number | null {
  const target = isoToUtcDate(targetIso);
  if (!target) return null;
  const refUtc = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  return Math.round((target.getTime() - refUtc) / (1000 * 60 * 60 * 24));
}

function normalizeHeader(header: string): string {
  return header.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

function cleanStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\s+/g, ' ').trim();
}

export function makeSafeDocId(prefix: string, index: number, staffCode: string): string {
  const slug = staffCode.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);
  return `${prefix}_${index}_${slug || 'record'}`;
}

function mapRowToEmployee(
  rowObj: Record<string, unknown>,
  rowIndex: number,
  authorizedUids: string[],
  actorUid: string
): EmployeeRecord | null {
  const normalized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rowObj)) {
    const nk = normalizeHeader(k);
    if (nk && !nk.startsWith('__EMPTY')) {
      normalized[nk] = v;
    }
  }

  const getField = (candidates: string[]): unknown => {
    for (const key of candidates) {
      if (normalized[key] !== undefined) return normalized[key];
      const partial = Object.keys(normalized).find((nk) => nk.startsWith(key));
      if (partial) return normalized[partial];
    }
    return '';
  };

  const staffCode = cleanStr(getField(['STAFF CODE', 'STAFF_CODE', 'STAFFCODE']));
  const firstName = cleanStr(getField(['FIRST NAME', 'FIRSTNAME']));
  const middleName = cleanStr(getField(['MIDDLE NAME', 'MIDDLENAME']));
  const lastName = cleanStr(getField(['LAST NAME', 'LASTNAME', 'SURNAME']));
  let fullName = cleanStr(getField(['FULL NAME', 'FULLNAME', 'NAME']));
  if (!fullName && (firstName || lastName)) {
    fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  }

  // Ignore blank rows and Excel serial-0 junk rows
  if (!staffCode && !fullName && !firstName && !lastName) {
    return null;
  }

  const snRaw = cleanStr(getField(['S/N', 'SN']));
  const snNum = snRaw && !Number.isNaN(Number(snRaw)) ? Number(snRaw) : null;

  const dob = parseFlexibleDate(getField(['DOB', 'DATE OF BIRTH']));
  const resumption = parseFlexibleDate(getField(['RESUMPTION DATE (CURRENT JOB ROLE)', 'RESUMPTION DATE']));
  const probStart = parseFlexibleDate(
    getField(['PROBATION START DATE CURRENT POSITION (6 MONTHS)', 'PROBATION START DATE'])
  );
  const probEnd = parseFlexibleDate(
    getField(['PROBATION END DATE CURRENT POSITION (6 MONTHS)', 'PROBATION END DATE'])
  );
  const confDate = parseFlexibleDate(
    getField(['CONFIRMATION DATE (CURRENT POSITION)', 'CONFIRMATION DATE'])
  );

  const safeCode = staffCode || `MISSING_CODE_${rowIndex + 1}`;
  const docId = makeSafeDocId('emp', rowIndex + 1, safeCode);

  return {
    id: docId,
    orgId: 'alert_mfb',
    sn: snNum,
    staffCode: safeCode,
    title: cleanStr(getField(['TITLE'])),
    firstName,
    middleName,
    lastName,
    fullName: fullName || safeCode,
    department: cleanStr(getField(['DEPARTMENT'])),
    jobRole: cleanStr(getField(['JOB ROLE', 'JOBROLE', 'ROLE'])),
    subsidiary: cleanStr(getField(['SUBSIDIARY'])),
    dobRaw: dob.raw,
    dobIso: dob.iso,
    officialEmail: cleanStr(getField(['OFFICIAL EMAIL'])),
    mobileNumber: cleanStr(getField(['MOBILE NUMBER', 'PHONE'])),
    personalEmail: cleanStr(getField(['PERSONAL EMAIL'])),
    gender: cleanStr(getField(['GENDER', 'SEX'])),
    maritalStatus: cleanStr(getField(['MARITAL STATUS'])),
    location: cleanStr(getField(['LOCATION', 'BRANCH'])),
    resumptionDateRaw: resumption.raw,
    resumptionDateIso: resumption.iso,
    probationRequired: cleanStr(
      getField(['PROBATION REQUIRED CURRENT POSITION (6 MONTHS)', 'PROBATION REQUIRED'])
    ),
    probationStartRaw: probStart.raw,
    probationStartIso: probStart.iso,
    probationEndRaw: probEnd.raw,
    probationEndIso: probEnd.iso,
    probationStatus: cleanStr(
      getField(['PROBATION STATUS CURRENT POSITION (6 MONTHS)', 'PROBATION STATUS'])
    ),
    confirmationDateRaw: confDate.raw,
    confirmationDateIso: confDate.iso,
    confirmationStatus: cleanStr(getField(['CONFIRMATION STATUS'])),
    authorizedUids: authorizedUids.length ? authorizedUids : [actorUid],
    updatedBy: actorUid,
  };
}

export function parseCsvStringToEmployees(
  csvText: string,
  authorizedUids: string[] = ['local_session'],
  actorUid = 'local_session'
): EmployeeRecord[] {
  const workbook = XLSX.read(csvText, { type: 'string', raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
  });
  const records: EmployeeRecord[] = [];
  rows.forEach((row, idx) => {
    const mapped = mapRowToEmployee(row, idx, authorizedUids, actorUid);
    if (mapped) records.push(mapped);
  });
  return records;
}

export async function parseSpreadsheetFileToEmployees(
  file: File,
  authorizedUids: string[],
  actorUid: string
): Promise<EmployeeRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
  });
  const records: EmployeeRecord[] = [];
  rows.forEach((row, idx) => {
    const mapped = mapRowToEmployee(row, idx, authorizedUids, actorUid);
    if (mapped) records.push(mapped);
  });
  return records;
}

export function computeEmployees(
  employees: EmployeeRecord[],
  referenceDate: Date = new Date()
): EmployeeComputed[] {
  // Count occurrences of staff codes to detect duplicates accurately
  const codeCounts = new Map<string, number>();
  employees.forEach((emp) => {
    const code = emp.staffCode.trim().toUpperCase();
    if (code) {
      codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
    }
  });

  const todayUtc = new Date(
    Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  );

  return employees.map((emp) => {
    const conflictReasons: string[] = [];
    const missingFields: string[] = [];
    const invalidDateFields: string[] = [];

    const upperCode = emp.staffCode.trim().toUpperCase();
    const isInvalidStaffCode =
      !upperCode || upperCode === '#REF!' || upperCode.startsWith('MISSING_CODE_');
    const isDuplicateStaffCode = !isInvalidStaffCode && (codeCounts.get(upperCode) || 0) > 1;

    if (isInvalidStaffCode) {
      conflictReasons.push(`Invalid Staff Code (${emp.staffCode || 'Blank'})`);
    }
    if (isDuplicateStaffCode) {
      conflictReasons.push(`Duplicate Staff Code (${emp.staffCode})`);
    }

    // Check missing fields
    if (!emp.officialEmail) missingFields.push('Official Email');
    if (!emp.mobileNumber) missingFields.push('Mobile Number');
    if (!emp.personalEmail) missingFields.push('Personal Email');
    if (!emp.dobIso) missingFields.push('DOB');
    if (!emp.department) missingFields.push('Department');
    if (!emp.jobRole) missingFields.push('Job Role');
    if (!emp.location) missingFields.push('Location');
    if (!emp.resumptionDateIso) missingFields.push('Resumption Date');

    // Check raw vs iso date validity
    if (emp.dobRaw && !emp.dobIso) invalidDateFields.push('DOB');
    if (emp.resumptionDateRaw && !emp.resumptionDateIso) invalidDateFields.push('Resumption Date');
    if (emp.probationStartRaw && !emp.probationStartIso) invalidDateFields.push('Probation Start Date');
    if (emp.probationEndRaw && !emp.probationEndIso) invalidDateFields.push('Probation End Date');
    if (emp.confirmationDateRaw && !emp.confirmationDateIso) invalidDateFields.push('Confirmation Date');

    // Age calculation
    let age: number | null = null;
    let ageValid = false;
    if (emp.dobIso) {
      const dobDate = isoToUtcDate(emp.dobIso);
      if (dobDate) {
        let calcAge = todayUtc.getUTCFullYear() - dobDate.getUTCFullYear();
        const mDiff = todayUtc.getUTCMonth() - dobDate.getUTCMonth();
        if (mDiff < 0 || (mDiff === 0 && todayUtc.getUTCDate() < dobDate.getUTCDate())) {
          calcAge--;
        }
        age = calcAge;
        if (calcAge < 16 || calcAge > 85) {
          ageValid = false;
          invalidDateFields.push(`Implausible DOB (${emp.dobRaw || emp.dobIso}, Age ${calcAge})`);
          conflictReasons.push(`Implausible DOB (Calculated Age: ${calcAge})`);
        } else {
          ageValid = true;
        }
      }
    }

    // Days until next birthday
    let daysUntilBirthday: number | null = null;
    if (emp.dobIso && ageValid) {
      const dobDate = isoToUtcDate(emp.dobIso);
      if (dobDate) {
        const thisYearBday = new Date(
          Date.UTC(todayUtc.getUTCFullYear(), dobDate.getUTCMonth(), dobDate.getUTCDate())
        );
        let nextBday = thisYearBday;
        if (thisYearBday.getTime() < todayUtc.getTime()) {
          nextBday = new Date(
            Date.UTC(todayUtc.getUTCFullYear() + 1, dobDate.getUTCMonth(), dobDate.getUTCDate())
          );
        }
        daysUntilBirthday = Math.round(
          (nextBday.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    // Current-role tenure calculation
    let tenureYears: number | null = null;
    let tenureLabel = 'Unavailable';
    if (emp.resumptionDateIso) {
      const resDate = isoToUtcDate(emp.resumptionDateIso);
      if (resDate) {
        const diffDays = (todayUtc.getTime() - resDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) {
          tenureYears = 0;
          tenureLabel = `Starts in ${Math.abs(Math.round(diffDays))}d`;
        } else {
          const years = diffDays / 365.25;
          tenureYears = Number(years.toFixed(2));
          const wholeYears = Math.floor(years);
          const remMonths = Math.floor((years - wholeYears) * 12);
          if (wholeYears === 0) {
            tenureLabel = `${Math.max(0, Math.floor(diffDays / 30.4375))} mos`;
          } else {
            tenureLabel = `${wholeYears}y ${remMonths}m`;
          }
        }
      }
    }

    // Probation calculations
    const probDaysRemaining = emp.probationEndIso
      ? diffDaysUtc(emp.probationEndIso, referenceDate)
      : null;

    const probReqLower = emp.probationRequired.trim().toLowerCase();
    const probStatusLower = emp.probationStatus.trim().toLowerCase();
    const confStatusLower = emp.confirmationStatus.trim().toLowerCase();

    let probationCategory: ProbationCategory = 'Unavailable';
    if (probReqLower === 'no') {
      probationCategory = 'Not Required';
    } else if (probStatusLower === 'completed') {
      probationCategory = 'Completed';
      if (probDaysRemaining !== null && probDaysRemaining > 0) {
        conflictReasons.push(
          `Probation marked Completed but End Date (${emp.probationEndRaw || emp.probationEndIso}) is in ${probDaysRemaining} days`
        );
      }
    } else if (probDaysRemaining !== null) {
      if (probDaysRemaining < 0) {
        probationCategory = 'Overdue';
      } else if (probDaysRemaining <= 7) {
        probationCategory = 'Due Within 7 Days';
      } else if (probDaysRemaining <= 30) {
        probationCategory = 'Approaching Deadline';
      } else {
        probationCategory = 'In Progress';
      }
    }

    // Confirmation calculations (never auto-confirm!)
    let confirmationCategory: ConfirmationCategory = 'Missing Data';
    if (confStatusLower === 'confirmed') {
      confirmationCategory = 'Confirmed';
      if (!emp.confirmationDateIso) {
        conflictReasons.push('Confirmed status recorded without a Confirmation Date');
      }
      if (probStatusLower !== 'completed' && probReqLower !== 'no') {
        conflictReasons.push('Confirmation marked Confirmed while Probation Status is not Completed');
      }
    } else if (confStatusLower === 'pending' || !confStatusLower) {
      if (probStatusLower === 'completed') {
        if (probDaysRemaining !== null && probDaysRemaining < -14) {
          confirmationCategory = 'Overdue Confirmation';
        } else {
          confirmationCategory = 'Confirmation Due';
        }
        conflictReasons.push('Probation Completed but Confirmation Status remains Pending');
      } else if (probDaysRemaining !== null) {
        if (probDaysRemaining < -14) {
          confirmationCategory = 'Overdue Confirmation';
        } else if (probDaysRemaining <= 7) {
          confirmationCategory = 'Confirmation Due';
        } else {
          confirmationCategory = 'Awaiting Confirmation';
        }
      } else {
        confirmationCategory = confStatusLower ? 'Awaiting Confirmation' : 'Missing Data';
      }
    } else {
      confirmationCategory = 'Awaiting Confirmation';
    }

    // Naming consistency checks
    if (emp.department.toLowerCase() === 'marketting') {
      conflictReasons.push('Department spelling inconsistency ("Marketting" instead of "Marketing")');
    }
    if (emp.location === 'kaduna') {
      conflictReasons.push('Location casing inconsistency ("kaduna" instead of "Kaduna")');
    }

    return {
      ...emp,
      age,
      ageValid,
      tenureYears,
      tenureLabel,
      probationDaysRemaining: probDaysRemaining,
      probationCategory,
      confirmationCategory,
      daysUntilBirthday,
      hasConflict: conflictReasons.length > 0,
      conflictReasons,
      missingFields,
      invalidDateFields,
      isDuplicateStaffCode,
      isInvalidStaffCode,
    };
  });
}
