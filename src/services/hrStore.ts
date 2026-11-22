import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AlertReview,
  EmployeeRecord,
  ImportAuditLog,
  UserAccount,
  UserRole,
  WorkspaceSettings,
} from '../types/hr';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'chiksonroyalemart@gmail.com';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  companyName: 'ALERT MFB',
  applicationName: 'ALERT MFB – HR Management System',
  tagline: 'Empowering People. Building Excellence.',
  dateFormat: 'DD MMM YYYY',
  logoDataUrl: '',
  notifyProbation7d: true,
  notifyProbation30d: true,
  notifyOverdue: true,
  notifyBirthdays: true,
  notifyDataQuality: true,
  authorizedUids: [],
  updatedBy: 'system',
};

function sanitizeEmployeePayload(
  emp: EmployeeRecord,
  authorizedUids: string[],
  actorUid: string,
  includeCreatedAt: boolean
) {
  const payload: Record<string, unknown> = {
    id: emp.id,
    orgId: 'alert_mfb',
    sn: emp.sn ?? null,
    staffCode: emp.staffCode,
    title: emp.title || '',
    firstName: emp.firstName || '',
    middleName: emp.middleName || '',
    lastName: emp.lastName || '',
    fullName: emp.fullName,
    department: emp.department || '',
    jobRole: emp.jobRole || '',
    subsidiary: emp.subsidiary || '',
    dobRaw: emp.dobRaw || '',
    dobIso: emp.dobIso || '',
    officialEmail: emp.officialEmail || '',
    mobileNumber: emp.mobileNumber || '',
    personalEmail: emp.personalEmail || '',
    gender: emp.gender || '',
    maritalStatus: emp.maritalStatus || '',
    location: emp.location || '',
    resumptionDateRaw: emp.resumptionDateRaw || '',
    resumptionDateIso: emp.resumptionDateIso || '',
    probationRequired: emp.probationRequired || '',
    probationStartRaw: emp.probationStartRaw || '',
    probationStartIso: emp.probationStartIso || '',
    probationEndRaw: emp.probationEndRaw || '',
    probationEndIso: emp.probationEndIso || '',
    probationStatus: emp.probationStatus || '',
    confirmationDateRaw: emp.confirmationDateRaw || '',
    confirmationDateIso: emp.confirmationDateIso || '',
    confirmationStatus: emp.confirmationStatus || '',
    authorizedUids: authorizedUids.length ? authorizedUids.slice(0, 25) : [actorUid],
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };
  if (includeCreatedAt) {
    payload.createdAt = serverTimestamp();
  }
  return payload;
}

export async function ensureUserAccount(firebaseUser: User): Promise<UserAccount> {
  const path = `users/${firebaseUser.uid}`;
  const ref = doc(db, 'users', firebaseUser.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    const isBootAdmin =
      (firebaseUser.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
      firebaseUser.emailVerified;
    const role: UserRole = isBootAdmin ? 'super_admin' : 'read_only';
    const newAccount: UserAccount = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || `${firebaseUser.uid}@alertmfb.local`,
      displayName: firebaseUser.displayName || firebaseUser.email || 'ALERT MFB User',
      role,
      status: 'active',
      departmentScope: 'All Departments',
    };
    await setDoc(ref, {
      ...newAccount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newAccount;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function seedEmployeesBatch(
  employees: EmployeeRecord[],
  authorizedUids: string[],
  actorUid: string
): Promise<void> {
  const CHUNK_SIZE = 400;
  try {
    for (let i = 0; i < employees.length; i += CHUNK_SIZE) {
      const chunk = employees.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((emp) => {
        const ref = doc(db, 'employees', emp.id);
        batch.set(ref, sanitizeEmployeePayload(emp, authorizedUids, actorUid, true));
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'employees');
  }
}

export async function upsertEmployeeDoc(
  emp: EmployeeRecord,
  isNew: boolean,
  authorizedUids: string[],
  actorUid: string,
  actorRole: UserRole
): Promise<void> {
  const path = `employees/${emp.id}`;
  const ref = doc(db, 'employees', emp.id);
  try {
    if (isNew) {
      await setDoc(ref, sanitizeEmployeePayload(emp, authorizedUids, actorUid, true));
    } else if (actorRole === 'hr_officer') {
      // HR Officers have tiered update permission limited to permitted fields
      await updateDoc(ref, {
        officialEmail: emp.officialEmail || '',
        mobileNumber: emp.mobileNumber || '',
        personalEmail: emp.personalEmail || '',
        maritalStatus: emp.maritalStatus || '',
        probationStatus: emp.probationStatus || '',
        confirmationDateRaw: emp.confirmationDateRaw || '',
        confirmationDateIso: emp.confirmationDateIso || '',
        confirmationStatus: emp.confirmationStatus || '',
        updatedBy: actorUid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, sanitizeEmployeePayload(emp, authorizedUids, actorUid, false));
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function batchUpdateEmployees(
  employees: EmployeeRecord[],
  authorizedUids: string[],
  actorUid: string
): Promise<void> {
  const CHUNK_SIZE = 400;
  try {
    for (let i = 0; i < employees.length; i += CHUNK_SIZE) {
      const chunk = employees.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((emp) => {
        const ref = doc(db, 'employees', emp.id);
        batch.update(ref, sanitizeEmployeePayload(emp, authorizedUids, actorUid, false));
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'employees');
  }
}

export async function deleteEmployeeDoc(employeeId: string): Promise<void> {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveWorkspaceSettings(
  settings: WorkspaceSettings,
  authorizedUids: string[],
  actorUid: string
): Promise<void> {
  const path = 'settings/alert_mfb';
  try {
    await setDoc(doc(db, 'settings', 'alert_mfb'), {
      companyName: settings.companyName,
      applicationName: settings.applicationName,
      tagline: settings.tagline,
      dateFormat: settings.dateFormat,
      logoDataUrl: settings.logoDataUrl || '',
      notifyProbation7d: settings.notifyProbation7d,
      notifyProbation30d: settings.notifyProbation30d,
      notifyOverdue: settings.notifyOverdue,
      notifyBirthdays: settings.notifyBirthdays,
      notifyDataQuality: settings.notifyDataQuality,
      authorizedUids: authorizedUids.length ? authorizedUids.slice(0, 25) : [actorUid],
      updatedBy: actorUid,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function createAlertReviewDoc(
  review: Omit<AlertReview, 'createdAt'>,
  authorizedUids: string[]
): Promise<void> {
  const path = `alertReviews/${review.id}`;
  try {
    await setDoc(doc(db, 'alertReviews', review.id), {
      ...review,
      authorizedUids: authorizedUids.length ? authorizedUids.slice(0, 25) : [review.reviewedByUid],
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function createImportAuditLog(
  log: Omit<ImportAuditLog, 'createdAt'>,
  authorizedUids: string[]
): Promise<void> {
  const path = `importLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'importLogs', log.id), {
      ...log,
      authorizedUids: authorizedUids.length ? authorizedUids.slice(0, 25) : [log.importedByUid],
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateUserRoleAndSync(
  targetUser: UserAccount,
  newRole: UserRole,
  newStatus: 'active' | 'suspended',
  currentEmployees: EmployeeRecord[],
  allUsers: UserAccount[],
  actorUid: string
): Promise<void> {
  const userPath = `users/${targetUser.uid}`;
  try {
    await updateDoc(doc(db, 'users', targetUser.uid), {
      role: newRole,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    const activeUids = Array.from(
      new Set([
        actorUid,
        ...allUsers
          .map((u) => (u.uid === targetUser.uid ? { ...u, status: newStatus } : u))
          .filter((u) => u.status === 'active')
          .map((u) => u.uid),
      ])
    ).slice(0, 25);

    if (currentEmployees.length > 0) {
      await batchUpdateEmployees(currentEmployees, activeUids, actorUid);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

export async function fetchAuthorizedEmployees(uid: string, isBootAdmin: boolean): Promise<EmployeeRecord[]> {
  const path = 'employees';
  try {
    const q = isBootAdmin
      ? collection(db, 'employees')
      : query(collection(db, 'employees'), where('authorizedUids', 'array-contains', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as EmployeeRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}
