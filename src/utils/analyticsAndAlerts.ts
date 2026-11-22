import {
  AlertItem,
  DataQualityIssue,
  DateFormatOption,
  EmployeeComputed,
  GlobalFilters,
} from '../types/hr';
import { formatDisplayDate } from './dateAndCsv';

export const DEFAULT_FILTERS: GlobalFilters = {
  search: '',
  department: 'ALL',
  jobRole: 'ALL',
  subsidiary: 'ALL',
  location: 'ALL',
  gender: 'ALL',
  maritalStatus: 'ALL',
  probationStatus: 'ALL',
  confirmationStatus: 'ALL',
  resumptionFrom: '',
  resumptionTo: '',
};

export function applyGlobalFilters(
  employees: EmployeeComputed[],
  filters: GlobalFilters
): EmployeeComputed[] {
  const q = filters.search.trim().toLowerCase();
  return employees.filter((emp) => {
    if (q) {
      const hay = `${emp.staffCode} ${emp.fullName} ${emp.department} ${emp.jobRole} ${emp.location} ${emp.subsidiary}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.department !== 'ALL' && emp.department !== filters.department) return false;
    if (filters.jobRole !== 'ALL' && emp.jobRole !== filters.jobRole) return false;
    if (filters.subsidiary !== 'ALL' && emp.subsidiary !== filters.subsidiary) return false;
    if (filters.location !== 'ALL' && emp.location !== filters.location) return false;
    if (filters.gender !== 'ALL' && emp.gender !== filters.gender) return false;
    if (filters.maritalStatus !== 'ALL' && emp.maritalStatus !== filters.maritalStatus) return false;
    if (filters.probationStatus !== 'ALL') {
      if (
        filters.probationStatus !== emp.probationCategory &&
        filters.probationStatus !== emp.probationStatus
      ) {
        return false;
      }
    }
    if (filters.confirmationStatus !== 'ALL') {
      if (
        filters.confirmationStatus !== emp.confirmationCategory &&
        filters.confirmationStatus !== emp.confirmationStatus
      ) {
        return false;
      }
    }
    if (filters.resumptionFrom && (!emp.resumptionDateIso || emp.resumptionDateIso < filters.resumptionFrom)) {
      return false;
    }
    if (filters.resumptionTo && (!emp.resumptionDateIso || emp.resumptionDateIso > filters.resumptionTo)) {
      return false;
    }
    return true;
  });
}

export function getDistinctValues(employees: EmployeeComputed[]) {
  const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  return {
    departments: uniq(employees.map((e) => e.department)),
    jobRoles: uniq(employees.map((e) => e.jobRole)),
    subsidiaries: uniq(employees.map((e) => e.subsidiary)),
    locations: uniq(employees.map((e) => e.location)),
    genders: uniq(employees.map((e) => e.gender)),
    maritalStatuses: uniq(employees.map((e) => e.maritalStatus)),
    probationCategories: [
      'In Progress',
      'Approaching Deadline',
      'Due Within 7 Days',
      'Overdue',
      'Completed',
      'Not Required',
      'Unavailable',
    ],
    confirmationCategories: [
      'Confirmed',
      'Confirmation Due',
      'Overdue Confirmation',
      'Awaiting Confirmation',
      'Missing Data',
    ],
  };
}

export function countByField(
  employees: EmployeeComputed[],
  extractor: (e: EmployeeComputed) => string
): { name: string; count: number; percentage: number }[] {
  const map = new Map<string, number>();
  employees.forEach((emp) => {
    const key = extractor(emp) || 'Unspecified';
    map.set(key, (map.get(key) || 0) + 1);
  });
  const total = employees.length || 1;
  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getAgeBrackets(employees: EmployeeComputed[]) {
  const brackets = [
    { name: '18–25', min: 18, max: 25, count: 0 },
    { name: '26–30', min: 26, max: 30, count: 0 },
    { name: '31–35', min: 31, max: 35, count: 0 },
    { name: '36–40', min: 36, max: 40, count: 0 },
    { name: '41–50', min: 41, max: 50, count: 0 },
    { name: '51+', min: 51, max: 120, count: 0 },
    { name: 'Invalid/Missing DOB', min: -999, max: 17, count: 0 },
  ];

  employees.forEach((emp) => {
    if (!emp.ageValid || emp.age === null) {
      brackets[6].count++;
      return;
    }
    const found = brackets.find((b) => b.min >= 18 && emp.age! >= b.min && emp.age! <= b.max);
    if (found) found.count++;
    else brackets[6].count++;
  });

  return brackets.filter((b) => b.count > 0 || b.min >= 18);
}

export function getTenureBrackets(employees: EmployeeComputed[]) {
  const brackets = [
    { name: '< 6 Months', count: 0 },
    { name: '6–12 Months', count: 0 },
    { name: '1–2 Years', count: 0 },
    { name: '2–5 Years', count: 0 },
    { name: '5+ Years', count: 0 },
    { name: 'Unavailable', count: 0 },
  ];

  employees.forEach((emp) => {
    if (emp.tenureYears === null) {
      brackets[5].count++;
    } else if (emp.tenureYears < 0.5) {
      brackets[0].count++;
    } else if (emp.tenureYears < 1) {
      brackets[1].count++;
    } else if (emp.tenureYears < 2) {
      brackets[2].count++;
    } else if (emp.tenureYears < 5) {
      brackets[3].count++;
    } else {
      brackets[4].count++;
    }
  });

  return brackets.filter((b) => b.count > 0 || b.name !== 'Unavailable');
}

export function generateHRAlerts(
  employees: EmployeeComputed[],
  dateFormat: DateFormatOption
): AlertItem[] {
  const alerts: AlertItem[] = [];

  employees.forEach((emp) => {
    if (emp.probationCategory === 'Due Within 7 Days') {
      alerts.push({
        alertKey: `prob7_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Probation Ending Within 7 Days',
        relevantDate: formatDisplayDate(emp.probationEndIso, emp.probationEndRaw, dateFormat),
        priority: 'Critical',
        suggestedAction: 'Schedule final probation appraisal and supervisor sign-off immediately.',
        details: `${emp.probationDaysRemaining} day(s) remaining until 6-month probation end date.`,
      });
    } else if (emp.probationCategory === 'Approaching Deadline') {
      alerts.push({
        alertKey: `prob30_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Probation Ending Within 30 Days',
        relevantDate: formatDisplayDate(emp.probationEndIso, emp.probationEndRaw, dateFormat),
        priority: 'High',
        suggestedAction: 'Initiate line manager performance evaluation and confirmation review.',
        details: `${emp.probationDaysRemaining} days remaining before probation ends.`,
      });
    } else if (emp.probationCategory === 'Overdue') {
      alerts.push({
        alertKey: `probOverdue_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Overdue Probation',
        relevantDate: formatDisplayDate(emp.probationEndIso, emp.probationEndRaw, dateFormat),
        priority: 'Critical',
        suggestedAction: 'Escalate overdue probation assessment to Department Head & HR Admin.',
        details: `Probation end date passed ${Math.abs(emp.probationDaysRemaining || 0)} days ago with status "${emp.probationStatus || 'Pending'}".`,
      });
    }

    if (emp.confirmationCategory === 'Overdue Confirmation') {
      alerts.push({
        alertKey: `confOverdue_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Overdue Confirmation',
        relevantDate: formatDisplayDate(
          emp.confirmationDateIso || emp.probationEndIso,
          emp.confirmationDateRaw || emp.probationEndRaw,
          dateFormat
        ),
        priority: 'Critical',
        suggestedAction: 'Issue formal confirmation letter or record extension decision.',
        details: `Confirmation status is "${emp.confirmationStatus || 'Pending'}" despite elapsed review date.`,
      });
    } else if (
      emp.confirmationCategory === 'Confirmation Due' ||
      emp.confirmationCategory === 'Awaiting Confirmation'
    ) {
      alerts.push({
        alertKey: `confAwait_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Awaiting Confirmation',
        relevantDate: formatDisplayDate(
          emp.confirmationDateIso || emp.probationEndIso,
          emp.confirmationDateRaw || emp.probationEndRaw,
          dateFormat
        ),
        priority: emp.confirmationCategory === 'Confirmation Due' ? 'High' : 'Low',
        suggestedAction: 'Track probation milestone and prepare confirmation dossier.',
        details: `Current confirmation status: ${emp.confirmationStatus || 'Pending'}.`,
      });
    }

    if (emp.daysUntilBirthday !== null && emp.daysUntilBirthday <= 30) {
      alerts.push({
        alertKey: `bday_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Upcoming Birthdays (30 Days)',
        relevantDate: formatDisplayDate(emp.dobIso, emp.dobRaw, dateFormat),
        priority: 'Low',
        suggestedAction: 'Prepare ALERT MFB employee birthday greeting.',
        details:
          emp.daysUntilBirthday === 0
            ? 'Birthday is today!'
            : `Birthday in ${emp.daysUntilBirthday} day(s).`,
      });
    }

    if (emp.isDuplicateStaffCode) {
      alerts.push({
        alertKey: `dup_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Duplicate Staff Codes',
        relevantDate: 'Data Audit',
        priority: 'Critical',
        suggestedAction: 'Verify HR payroll ID and assign a unique STAFF CODE.',
        details: `Staff Code ${emp.staffCode} is shared by multiple employee records.`,
      });
    }

    if (emp.invalidDateFields.length > 0 || emp.isInvalidStaffCode) {
      alerts.push({
        alertKey: `invDate_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Invalid Date Records',
        relevantDate: emp.dobRaw || 'Check Record',
        priority: 'High',
        suggestedAction: 'Correct invalid date or reference value in employee profile.',
        details: [
          emp.isInvalidStaffCode ? `Invalid Staff Code: ${emp.staffCode}` : '',
          ...emp.invalidDateFields.map((f) => `Invalid ${f}`),
        ]
          .filter(Boolean)
          .join('; '),
      });
    }

    if (emp.missingFields.length > 0) {
      alerts.push({
        alertKey: `miss_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        staffCode: emp.staffCode,
        department: emp.department,
        category: 'Missing Employee Information',
        relevantDate: 'Profile Incomplete',
        priority: 'Medium',
        suggestedAction: 'Request missing contact/profile information from employee.',
        details: `Missing: ${emp.missingFields.join(', ')}.`,
      });
    }
  });

  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function generateDataQualityIssues(employees: EmployeeComputed[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  employees.forEach((emp) => {
    if (emp.isDuplicateStaffCode) {
      issues.push({
        id: `dq_dup_${emp.id}`,
        employeeId: emp.id,
        staffCode: emp.staffCode,
        fullName: emp.fullName,
        department: emp.department,
        issueType: 'Duplicate Staff Code',
        severity: 'High',
        description: `Staff Code "${emp.staffCode}" appears more than once in the directory.`,
      });
    }
    if (emp.isInvalidStaffCode) {
      issues.push({
        id: `dq_ref_${emp.id}`,
        employeeId: emp.id,
        staffCode: emp.staffCode,
        fullName: emp.fullName,
        department: emp.department,
        issueType: 'Invalid Staff Code',
        severity: 'High',
        description: `Invalid or broken spreadsheet formula reference ("${emp.staffCode}") detected.`,
      });
    }
    emp.invalidDateFields.forEach((field, idx) => {
      issues.push({
        id: `dq_date_${emp.id}_${idx}`,
        employeeId: emp.id,
        staffCode: emp.staffCode,
        fullName: emp.fullName,
        department: emp.department,
        issueType: 'Invalid Date',
        severity: 'High',
        description: field,
      });
    });
    if (emp.department.toLowerCase() === 'marketting') {
      issues.push({
        id: `dq_dept_${emp.id}`,
        employeeId: emp.id,
        staffCode: emp.staffCode,
        fullName: emp.fullName,
        department: emp.department,
        issueType: 'Inconsistent Naming',
        severity: 'Medium',
        description: `Department spelled "${emp.department}" instead of "Marketing".`,
      });
    }
    if (emp.location === 'kaduna') {
      issues.push({
        id: `dq_loc_${emp.id}`,
        employeeId: emp.id,
        staffCode: emp.staffCode,
        fullName: emp.fullName,
        department: emp.department,
        issueType: 'Inconsistent Naming',
        severity: 'Low',
        description: `Location casing "${emp.location}" should be capitalized as "Kaduna".`,
      });
    }
    emp.conflictReasons
      .filter(
        (r) =>
          !r.includes('Duplicate Staff Code') &&
          !r.includes('Invalid Staff Code') &&
          !r.includes('Implausible DOB') &&
          !r.includes('Department spelling') &&
          !r.includes('Location casing')
      )
      .forEach((reason, idx) => {
        issues.push({
          id: `dq_conf_${emp.id}_${idx}`,
          employeeId: emp.id,
          staffCode: emp.staffCode,
          fullName: emp.fullName,
          department: emp.department,
          issueType: 'Probation/Confirmation Conflict',
          severity: 'Medium',
          description: reason,
        });
      });

    if (emp.missingFields.length > 0) {
      issues.push({
        id: `dq_miss_${emp.id}`,
        employeeId: emp.id,
        staffCode: emp.staffCode,
        fullName: emp.fullName,
        department: emp.department,
        issueType: 'Missing Information',
        severity: 'Low',
        description: `Missing fields: ${emp.missingFields.join(', ')}.`,
      });
    }
  });

  return issues;
}
