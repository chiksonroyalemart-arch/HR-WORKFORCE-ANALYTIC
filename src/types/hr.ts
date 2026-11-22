export type UserRole = 'super_admin' | 'hr_admin' | 'hr_officer' | 'read_only';

export type NavPage =
  | 'dashboard'
  | 'directory'
  | 'departments'
  | 'job_roles'
  | 'subsidiaries'
  | 'locations'
  | 'analytics'
  | 'probation'
  | 'confirmation'
  | 'alerts'
  | 'reports'
  | 'data_management'
  | 'settings';

export type DateFormatOption = 'DD MMM YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  departmentScope: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EmployeeRecord {
  id: string;
  orgId: 'alert_mfb';
  sn: number | null;
  staffCode: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  department: string;
  jobRole: string;
  subsidiary: string;
  dobRaw: string;
  dobIso: string;
  officialEmail: string;
  mobileNumber: string;
  personalEmail: string;
  gender: string;
  maritalStatus: string;
  location: string;
  resumptionDateRaw: string;
  resumptionDateIso: string;
  probationRequired: string;
  probationStartRaw: string;
  probationStartIso: string;
  probationEndRaw: string;
  probationEndIso: string;
  probationStatus: string;
  confirmationDateRaw: string;
  confirmationDateIso: string;
  confirmationStatus: string;
  authorizedUids: string[];
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ProbationCategory =
  | 'In Progress'
  | 'Approaching Deadline'
  | 'Due Within 7 Days'
  | 'Overdue'
  | 'Completed'
  | 'Not Required'
  | 'Unavailable';

export type ConfirmationCategory =
  | 'Confirmed'
  | 'Confirmation Due'
  | 'Overdue Confirmation'
  | 'Awaiting Confirmation'
  | 'Missing Data';

export interface EmployeeComputed extends EmployeeRecord {
  age: number | null;
  ageValid: boolean;
  tenureYears: number | null;
  tenureLabel: string;
  probationDaysRemaining: number | null;
  probationCategory: ProbationCategory;
  confirmationCategory: ConfirmationCategory;
  daysUntilBirthday: number | null;
  hasConflict: boolean;
  conflictReasons: string[];
  missingFields: string[];
  invalidDateFields: string[];
  isDuplicateStaffCode: boolean;
  isInvalidStaffCode: boolean;
}

export interface GlobalFilters {
  search: string;
  department: string;
  jobRole: string;
  subsidiary: string;
  location: string;
  gender: string;
  maritalStatus: string;
  probationStatus: string;
  confirmationStatus: string;
  resumptionFrom: string;
  resumptionTo: string;
}

export type AlertCategory =
  | 'Probation Ending Within 7 Days'
  | 'Probation Ending Within 30 Days'
  | 'Overdue Probation'
  | 'Awaiting Confirmation'
  | 'Overdue Confirmation'
  | 'Upcoming Birthdays (30 Days)'
  | 'Missing Employee Information'
  | 'Duplicate Staff Codes'
  | 'Invalid Date Records';

export type AlertPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AlertItem {
  alertKey: string;
  employeeId: string;
  employeeName: string;
  staffCode: string;
  department: string;
  category: AlertCategory;
  relevantDate: string;
  priority: AlertPriority;
  suggestedAction: string;
  details: string;
}

export interface AlertReview {
  id: string;
  orgId: 'alert_mfb';
  alertKey: string;
  reviewedByUid: string;
  reviewedByEmail: string;
  notes: string;
  authorizedUids: string[];
  createdAt?: unknown;
}

export interface ImportAuditLog {
  id: string;
  orgId: 'alert_mfb';
  fileName: string;
  importedByUid: string;
  importedByEmail: string;
  addedCount: number;
  updatedCount: number;
  duplicateCount: number;
  skippedCount: number;
  authorizedUids: string[];
  createdAt?: unknown;
}

export interface WorkspaceSettings {
  companyName: string;
  applicationName: string;
  tagline: string;
  dateFormat: DateFormatOption;
  logoDataUrl: string;
  notifyProbation7d: boolean;
  notifyProbation30d: boolean;
  notifyOverdue: boolean;
  notifyBirthdays: boolean;
  notifyDataQuality: boolean;
  authorizedUids: string[];
  updatedBy: string;
  updatedAt?: unknown;
}

export interface DataQualityIssue {
  id: string;
  employeeId: string;
  staffCode: string;
  fullName: string;
  department: string;
  issueType:
    | 'Duplicate Staff Code'
    | 'Invalid Staff Code'
    | 'Invalid Date'
    | 'Inconsistent Naming'
    | 'Probation/Confirmation Conflict'
    | 'Missing Information';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
}

export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    label: string;
    description: string;
    canEditEmployees: boolean;
    canAddDeleteEmployees: boolean;
    canManageProbationConfirmation: boolean;
    canImportExport: boolean;
    canManageSettingsUsers: boolean;
    canReviewAlerts: boolean;
    canViewSensitiveContactPII: boolean;
  }
> = {
  super_admin: {
    label: 'Super Administrator',
    description: 'Full system access, user & role governance, configuration, and data administration.',
    canEditEmployees: true,
    canAddDeleteEmployees: true,
    canManageProbationConfirmation: true,
    canImportExport: true,
    canManageSettingsUsers: true,
    canReviewAlerts: true,
    canViewSensitiveContactPII: true,
  },
  hr_admin: {
    label: 'HR Administrator',
    description: 'Employee administration, probation & confirmation management, imports, and HR reporting.',
    canEditEmployees: true,
    canAddDeleteEmployees: true,
    canManageProbationConfirmation: true,
    canImportExport: true,
    canManageSettingsUsers: false,
    canReviewAlerts: true,
    canViewSensitiveContactPII: true,
  },
  hr_officer: {
    label: 'HR Officer',
    description: 'View employee directory, update contact/probation/confirmation records, review alerts.',
    canEditEmployees: true,
    canAddDeleteEmployees: false,
    canManageProbationConfirmation: true,
    canImportExport: true,
    canManageSettingsUsers: false,
    canReviewAlerts: true,
    canViewSensitiveContactPII: true,
  },
  read_only: {
    label: 'Read-Only Management User',
    description: 'View executive workforce analytics and authorized reports with personal contact PII masked.',
    canEditEmployees: false,
    canAddDeleteEmployees: false,
    canManageProbationConfirmation: false,
    canImportExport: false,
    canManageSettingsUsers: false,
    canReviewAlerts: false,
    canViewSensitiveContactPII: false,
  },
};
