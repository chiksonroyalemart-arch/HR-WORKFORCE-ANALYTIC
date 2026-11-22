import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { CheckCircle2, Info, X } from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { RAW_EMPLOYEE_CSV } from './data/rawEmployeeCsv';
import {
  AlertItem,
  AlertReview,
  EmployeeComputed,
  EmployeeRecord,
  GlobalFilters,
  ImportAuditLog,
  NavPage,
  UserAccount,
  UserRole,
  WorkspaceSettings,
} from './types/hr';
import { computeEmployees, parseCsvStringToEmployees } from './utils/dateAndCsv';
import {
  applyGlobalFilters,
  DEFAULT_FILTERS,
  generateDataQualityIssues,
  generateHRAlerts,
  getDistinctValues,
} from './utils/analyticsAndAlerts';
import {
  batchUpdateEmployees,
  BOOTSTRAPPED_ADMIN_EMAIL,
  createAlertReviewDoc,
  createImportAuditLog,
  DEFAULT_SETTINGS,
  deleteEmployeeDoc,
  ensureUserAccount,
  fetchAuthorizedEmployees,
  saveWorkspaceSettings,
  seedEmployeesBatch,
  updateUserRoleAndSync,
  upsertEmployeeDoc,
} from './services/hrStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrandLogo } from './components/BrandLogo';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { DashboardView } from './components/DashboardView';
import { EmployeeDirectoryView } from './components/EmployeeDirectoryView';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import { EntityDirectoryViews } from './components/EntityDirectoryViews';
import { HRAnalyticsView } from './components/HRAnalyticsView';
import { ProbationManagementView } from './components/ProbationManagementView';
import { ConfirmationManagementView } from './components/ConfirmationManagementView';
import { HRAlertsView } from './components/HRAlertsView';
import { ReportsView } from './components/ReportsView';
import { DataManagementView } from './components/DataManagementView';
import { SettingsView } from './components/SettingsView';

function MainApp() {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole>('super_admin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [rawEmployees, setRawEmployees] = useState<EmployeeRecord[]>(() =>
    parseCsvStringToEmployees(RAW_EMPLOYEE_CSV)
  );
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [alertReviews, setAlertReviews] = useState<AlertReview[]>([]);
  const [importLogs, setImportLogs] = useState<ImportAuditLog[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_SETTINGS);

  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Monitor Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          setLoadingData(true);
          const account = await ensureUserAccount(user);
          setCurrentUser(account);
          setPreviewRole(account.role);
          setPreviewMode(false);
          setAuthError(null);
        } catch (err) {
          setAuthError(err instanceof Error ? err.message : 'Unable to load user profile.');
        } finally {
          setLoadingData(false);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isBootstrappedAdmin = Boolean(
    firebaseUser?.emailVerified &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );

  // Attach Firestore listeners only when authenticated & verified
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified || !currentUser) return;
    if (currentUser.status === 'suspended') return;

    const uid = firebaseUser.uid;
    let active = true;

    // Seed initial 278-row dataset if Firestore is empty and user is Admin
    const initFirestore = async () => {
      try {
        const existing = await fetchAuthorizedEmployees(uid, isBootstrappedAdmin);
        if (!active) return;
        if (existing.length === 0 && (isBootstrappedAdmin || currentUser.role === 'super_admin')) {
          const initialRecords = parseCsvStringToEmployees(RAW_EMPLOYEE_CSV, [uid], uid);
          await seedEmployeesBatch(initialRecords, [uid], uid);
          await saveWorkspaceSettings(DEFAULT_SETTINGS, [uid], uid);
        }
      } catch {
        // Handled by error boundary / listener
      }
    };
    void initFirestore();

    const empQuery = isBootstrappedAdmin
      ? collection(db, 'employees')
      : query(collection(db, 'employees'), where('authorizedUids', 'array-contains', uid));

    const unsubEmployees = onSnapshot(
      empQuery,
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as EmployeeRecord);
        if (docs.length > 0) {
          docs.sort((a, b) => (a.sn ?? 9999) - (b.sn ?? 9999));
          setRawEmployees(docs);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'employees');
      }
    );

    const reviewsQuery = isBootstrappedAdmin
      ? collection(db, 'alertReviews')
      : query(collection(db, 'alertReviews'), where('authorizedUids', 'array-contains', uid));

    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snap) => {
        setAlertReviews(snap.docs.map((d) => d.data() as AlertReview));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'alertReviews');
      }
    );

    const logsQuery = isBootstrappedAdmin
      ? collection(db, 'importLogs')
      : query(collection(db, 'importLogs'), where('authorizedUids', 'array-contains', uid));

    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        setImportLogs(snap.docs.map((d) => d.data() as ImportAuditLog));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'importLogs');
      }
    );

    const usersQuery = isBootstrappedAdmin
      ? collection(db, 'users')
      : query(collection(db, 'users'), where('uid', '==', uid));

    const unsubUsers = onSnapshot(
      usersQuery,
      (snap) => {
        setUsers(snap.docs.map((d) => d.data() as UserAccount));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );

    void getDoc(doc(db, 'settings', 'alert_mfb'))
      .then((snap) => {
        if (snap.exists() && active) {
          setSettings(snap.data() as WorkspaceSettings);
        }
      })
      .catch(() => {
        // Fallback to default settings if not yet created
      });

    return () => {
      active = false;
      unsubEmployees();
      unsubReviews();
      unsubLogs();
      unsubUsers();
    };
  }, [firebaseUser, currentUser, isBootstrappedAdmin]);

  const isFirebaseAuthenticated = Boolean(firebaseUser && currentUser);
  const effectiveRole: UserRole = isFirebaseAuthenticated
    ? currentUser!.role === 'super_admin'
      ? previewRole
      : currentUser!.role
    : previewRole;

  const authorizedUids = useMemo(() => {
    const activeUids = users.filter((u) => u.status === 'active').map((u) => u.uid);
    if (firebaseUser?.uid && !activeUids.includes(firebaseUser.uid)) {
      activeUids.unshift(firebaseUser.uid);
    }
    return activeUids.length ? activeUids.slice(0, 25) : ['local_session'];
  }, [users, firebaseUser]);

  const actorUid = firebaseUser?.uid || 'local_session';
  const actorEmail = firebaseUser?.email || 'local@alertmfb.local';

  // Dynamic Calculations (using actual current date!)
  const computedEmployees = useMemo(() => computeEmployees(rawEmployees, new Date()), [rawEmployees]);
  const filterOptions = useMemo(() => getDistinctValues(computedEmployees), [computedEmployees]);
  const filteredEmployees = useMemo(
    () => applyGlobalFilters(computedEmployees, filters),
    [computedEmployees, filters]
  );

  const alerts = useMemo(
    () => generateHRAlerts(filteredEmployees, settings.dateFormat),
    [filteredEmployees, settings.dateFormat]
  );
  const dataQualityIssues = useMemo(
    () => generateDataQualityIssues(filteredEmployees),
    [filteredEmployees]
  );

  const unreviewedAlertsCount = useMemo(() => {
    const reviewedSet = new Set(alertReviews.map((r) => r.alertKey));
    return alerts.filter((a) => !reviewedSet.has(a.alertKey)).length;
  }, [alerts, alertReviews]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.department !== 'ALL') count++;
    if (filters.jobRole !== 'ALL') count++;
    if (filters.subsidiary !== 'ALL') count++;
    if (filters.location !== 'ALL') count++;
    if (filters.gender !== 'ALL') count++;
    if (filters.maritalStatus !== 'ALL') count++;
    if (filters.probationStatus !== 'ALL') count++;
    if (filters.confirmationStatus !== 'ALL') count++;
    if (filters.resumptionFrom) count++;
    if (filters.resumptionTo) count++;
    return count;
  }, [filters]);

  const selectedEmployee: EmployeeComputed | null = useMemo(
    () => computedEmployees.find((e) => e.id === selectedEmployeeId) || null,
    [computedEmployees, selectedEmployeeId]
  );

  // Handlers
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (firebaseUser) {
      await signOut(auth);
    }
    setPreviewMode(false);
    setSelectedEmployeeId(null);
  };

  const handleSaveEmployee = async (updated: EmployeeRecord) => {
    if (isFirebaseAuthenticated && currentUser) {
      await upsertEmployeeDoc(updated, false, authorizedUids, actorUid, currentUser.role);
      showToast(`Saved changes for ${updated.fullName} to Firestore.`);
    } else {
      setRawEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      showToast(`Updated ${updated.fullName} in local session (sign in to persist).`);
    }
  };

  const handleCreateEmployee = async (newEmp: EmployeeRecord) => {
    if (isFirebaseAuthenticated && currentUser) {
      await upsertEmployeeDoc(newEmp, true, authorizedUids, actorUid, currentUser.role);
      showToast(`Created employee ${newEmp.fullName} in Firestore.`);
    } else {
      setRawEmployees((prev) => [newEmp, ...prev]);
      showToast(`Added ${newEmp.fullName} to local session.`);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (isFirebaseAuthenticated) {
      await deleteEmployeeDoc(employeeId);
      showToast('Employee record permanently deleted from Firestore.');
    } else {
      setRawEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      showToast('Employee removed from local session.');
    }
    setSelectedEmployeeId(null);
  };

  const handleReviewAlert = async (alert: AlertItem) => {
    const reviewId = `rev_${alert.alertKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const reviewPayload: Omit<AlertReview, 'createdAt'> = {
      id: reviewId,
      orgId: 'alert_mfb',
      alertKey: alert.alertKey,
      reviewedByUid: actorUid,
      reviewedByEmail: actorEmail,
      notes: 'Reviewed in HR Alerts Centre',
      authorizedUids,
    };
    if (isFirebaseAuthenticated) {
      await createAlertReviewDoc(reviewPayload, authorizedUids);
      showToast('Alert marked as reviewed.');
    } else {
      setAlertReviews((prev) => [...prev, reviewPayload]);
      showToast('Alert marked as reviewed (local session).');
    }
  };

  const handleApplyImport = async (options: {
    fileName: string;
    newRecords: EmployeeRecord[];
    updatedRecords: EmployeeRecord[];
    duplicateCount: number;
    skippedCount: number;
  }) => {
    if (isFirebaseAuthenticated) {
      if (options.newRecords.length > 0) {
        await seedEmployeesBatch(options.newRecords, authorizedUids, actorUid);
      }
      if (options.updatedRecords.length > 0) {
        await batchUpdateEmployees(options.updatedRecords, authorizedUids, actorUid);
      }
      await createImportAuditLog(
        {
          id: `imp_${Date.now()}`,
          orgId: 'alert_mfb',
          fileName: options.fileName,
          importedByUid: actorUid,
          importedByEmail: actorEmail,
          addedCount: options.newRecords.length,
          updatedCount: options.updatedRecords.length,
          duplicateCount: options.duplicateCount,
          skippedCount: options.skippedCount,
          authorizedUids,
        },
        authorizedUids
      );
      showToast('Dataset import committed to Firestore.');
    } else {
      const updatedMap = new Map(options.updatedRecords.map((u) => [u.id, u]));
      setRawEmployees((prev) => [
        ...prev.map((e) => updatedMap.get(e.id) || e),
        ...options.newRecords,
      ]);
      setImportLogs((prev) => [
        {
          id: `imp_${Date.now()}`,
          orgId: 'alert_mfb',
          fileName: options.fileName,
          importedByUid: actorUid,
          importedByEmail: actorEmail,
          addedCount: options.newRecords.length,
          updatedCount: options.updatedRecords.length,
          duplicateCount: options.duplicateCount,
          skippedCount: options.skippedCount,
          authorizedUids,
        },
        ...prev,
      ]);
      showToast('Dataset import applied in local session.');
    }
  };

  const handleBatchStandardize = async (updatedRecords: EmployeeRecord[]) => {
    if (isFirebaseAuthenticated) {
      await batchUpdateEmployees(updatedRecords, authorizedUids, actorUid);
      showToast(`Standardized ${updatedRecords.length} department/location records in Firestore.`);
    } else {
      const map = new Map(updatedRecords.map((u) => [u.id, u]));
      setRawEmployees((prev) => prev.map((e) => map.get(e.id) || e));
      showToast(`Standardized ${updatedRecords.length} records in local session.`);
    }
  };

  const handleSaveSettings = async (next: WorkspaceSettings) => {
    if (isFirebaseAuthenticated) {
      await saveWorkspaceSettings(next, authorizedUids, actorUid);
    }
    setSettings(next);
    showToast('Organization settings updated.');
  };

  const handleUpdateUserRole = async (
    target: UserAccount,
    role: UserRole,
    status: 'active' | 'suspended'
  ) => {
    if (!isFirebaseAuthenticated) return;
    await updateUserRoleAndSync(target, role, status, rawEmployees, users, actorUid);
    showToast(`Updated access role for ${target.displayName}.`);
  };

  const handleReseedOriginalDataset = async () => {
    const fresh = parseCsvStringToEmployees(RAW_EMPLOYEE_CSV, authorizedUids, actorUid);
    if (isFirebaseAuthenticated) {
      await seedEmployeesBatch(fresh, authorizedUids, actorUid);
      showToast('Restored original 278-employee ALERT MFB dataset to Firestore.');
    } else {
      setRawEmployees(fresh);
      showToast('Restored original 278-employee dataset in local session.');
    }
  };

  // Loading Screen with Official ALERT MFB Logo
  if (!authReady || loadingData) {
    return (
      <div className="min-h-screen bg-[#0C0843] flex flex-col items-center justify-center p-6 text-white">
        <BrandLogo logoUrl={settings.logoDataUrl} size="xl" variant="dark" />
        <h1 className="font-display text-xl font-bold mt-5 tracking-tight">
          ALERT MFB – HR Management System
        </h1>
        <p className="text-xs text-[#E5C66F] mt-1">Empowering People. Building Excellence.</p>
        <div className="w-48 h-1 bg-white/15 rounded-full overflow-hidden mt-6">
          <div className="h-full w-1/2 bg-[#D2A946] animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  // Login Gate
  if (!isFirebaseAuthenticated && !previewMode) {
    return (
      <LoginPage
        logoUrl={settings.logoDataUrl}
        onGoogleSignIn={handleGoogleSignIn}
        onEnterPreview={() => setPreviewMode(true)}
        authError={authError}
        isSigningIn={isSigningIn}
      />
    );
  }

  // Suspended Account Gate
  if (currentUser?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#F6F6FA] flex items-center justify-center p-6">
        <div className="max-w-md bg-white border border-[#E6E5ED] rounded-xl p-8 text-center">
          <BrandLogo logoUrl={settings.logoDataUrl} size="lg" className="mx-auto mb-4" />
          <h1 className="font-display text-lg font-bold text-[#0C0843]">Access Suspended</h1>
          <p className="text-xs text-[#6B6B80] mt-2 mb-5">
            Your ALERT MFB HRMIS account is currently suspended. Contact a Super Administrator.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-semibold bg-[#0C0843] text-white rounded-lg cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6FA] text-[#17172B] flex">
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        alertCount={unreviewedAlertsCount}
        logoUrl={settings.logoDataUrl}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 lg:pl-[264px] flex flex-col min-w-0">
        <Header
          activePage={activePage}
          logoUrl={settings.logoDataUrl}
          searchQuery={filters.search}
          onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
          unreviewedAlertsCount={unreviewedAlertsCount}
          onOpenAlerts={() => setActivePage('alerts')}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((s) => !s)}
          activeFilterCount={activeFilterCount}
          currentUser={currentUser}
          isFirebaseAuthenticated={isFirebaseAuthenticated}
          onSignOut={handleSignOut}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {showFilters && (
          <GlobalFilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            options={filterOptions}
            totalCount={computedEmployees.length}
            filteredCount={filteredEmployees.length}
          />
        )}

        {/* Honest Non-Persisted Notice in Local Session */}
        {!isFirebaseAuthenticated && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-[#FBF6E9] border border-[#D2A946]/70 text-xs text-[#17172B] flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#8C6812] shrink-0" />
              <span>
                <strong>Local In-Memory Session:</strong> Changes are not persisted to Firebase
                Firestore until you sign in with Google Workspace.
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="px-3 py-1.5 rounded-lg bg-[#0C0843] text-white text-xs font-semibold hover:bg-[#17134F] cursor-pointer"
            >
              Sign In to Persist Data
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">
          {activePage === 'dashboard' && (
            <DashboardView
              employees={filteredEmployees}
              dateFormat={settings.dateFormat}
              userRole={effectiveRole}
              onSelectEmployee={(emp) => setSelectedEmployeeId(emp.id)}
              onNavigate={setActivePage}
              onOpenAddEmployee={() => setShowAddModal(true)}
            />
          )}

          {activePage === 'directory' && (
            <EmployeeDirectoryView
              employees={filteredEmployees}
              dateFormat={settings.dateFormat}
              userRole={effectiveRole}
              onSelectEmployee={(emp) => setSelectedEmployeeId(emp.id)}
              onOpenAddEmployee={() => setShowAddModal(true)}
            />
          )}

          {(activePage === 'departments' ||
            activePage === 'job_roles' ||
            activePage === 'subsidiaries' ||
            activePage === 'locations') && (
            <EntityDirectoryViews
              mode={activePage}
              employees={filteredEmployees}
              dateFormat={settings.dateFormat}
              onSelectEmployee={(emp) => setSelectedEmployeeId(emp.id)}
            />
          )}

          {activePage === 'analytics' && (
            <HRAnalyticsView
              employees={filteredEmployees}
              userRole={effectiveRole}
              logoUrl={settings.logoDataUrl}
            />
          )}

          {activePage === 'probation' && (
            <ProbationManagementView
              employees={filteredEmployees}
              dateFormat={settings.dateFormat}
              userRole={effectiveRole}
              onSelectEmployee={(emp) => setSelectedEmployeeId(emp.id)}
              onUpdateEmployee={handleSaveEmployee}
            />
          )}

          {activePage === 'confirmation' && (
            <ConfirmationManagementView
              employees={filteredEmployees}
              dateFormat={settings.dateFormat}
              userRole={effectiveRole}
              onSelectEmployee={(emp) => setSelectedEmployeeId(emp.id)}
              onUpdateEmployee={handleSaveEmployee}
            />
          )}

          {activePage === 'alerts' && (
            <HRAlertsView
              alerts={alerts}
              reviews={alertReviews}
              employees={computedEmployees}
              userRole={effectiveRole}
              onReviewAlert={handleReviewAlert}
              onSelectEmployee={(emp) => setSelectedEmployeeId(emp.id)}
            />
          )}

          {activePage === 'reports' && (
            <ReportsView
              employees={filteredEmployees}
              dataQualityIssues={dataQualityIssues}
              dateFormat={settings.dateFormat}
              userRole={effectiveRole}
              logoUrl={settings.logoDataUrl}
            />
          )}

          {activePage === 'data_management' && (
            <DataManagementView
              employees={filteredEmployees}
              dataQualityIssues={dataQualityIssues}
              importLogs={importLogs}
              userRole={effectiveRole}
              actorUid={actorUid}
              onApplyImport={handleApplyImport}
              onBatchStandardize={handleBatchStandardize}
              onSelectEmployee={(emp) => setSelectedEmployeeId(emp.id)}
            />
          )}

          {activePage === 'settings' && (
            <SettingsView
              settings={settings}
              users={users}
              currentUser={currentUser}
              userRole={effectiveRole}
              isFirebaseAuthenticated={isFirebaseAuthenticated}
              importLogs={importLogs}
              dataQualityIssues={dataQualityIssues}
              onSaveSettings={handleSaveSettings}
              onUpdateUserRole={handleUpdateUserRole}
              onReseedOriginalDataset={handleReseedOriginalDataset}
              onPreviewRoleChange={setPreviewRole}
            />
          )}
        </main>

        {/* Official Footer */}
        <footer className="px-6 py-4 bg-white border-t border-[#E6E5ED] text-xs text-[#6B6B80] flex flex-wrap items-center justify-between gap-2 no-print">
          <span>© ALERT MFB | Human Resources Management System</span>
          <span className="font-medium text-[#0C0843]">
            Empowering People. Building Excellence.
          </span>
        </footer>
      </div>

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          dateFormat={settings.dateFormat}
          userRole={effectiveRole}
          logoUrl={settings.logoDataUrl}
          onClose={() => setSelectedEmployeeId(null)}
          onSave={handleSaveEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}

      {/* Add New Employee Modal */}
      {showAddModal && (
        <EmployeeFormModal
          existingEmployees={rawEmployees}
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateEmployee}
        />
      )}

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0C0843] text-white border border-[#D2A946] rounded-xl px-4 py-3 shadow-lg flex items-center gap-2.5 text-xs no-print">
          <CheckCircle2 className="w-4 h-4 text-[#D2A946] shrink-0" />
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
