import React, { useState } from 'react';
import {
  CheckCircle2,
  Palette,
  RefreshCw,
  Shield,
  Upload,
  Users,
} from 'lucide-react';
import {
  DataQualityIssue,
  DateFormatOption,
  ImportAuditLog,
  ROLE_PERMISSIONS,
  UserAccount,
  UserRole,
  WorkspaceSettings,
} from '../types/hr';
import { BrandLogo } from './BrandLogo';

interface SettingsViewProps {
  settings: WorkspaceSettings;
  users: UserAccount[];
  currentUser: UserAccount | null;
  userRole: UserRole;
  isFirebaseAuthenticated: boolean;
  importLogs: ImportAuditLog[];
  dataQualityIssues: DataQualityIssue[];
  onSaveSettings: (next: WorkspaceSettings) => Promise<void>;
  onUpdateUserRole: (
    target: UserAccount,
    role: UserRole,
    status: 'active' | 'suspended'
  ) => Promise<void>;
  onReseedOriginalDataset: () => Promise<void>;
  onPreviewRoleChange: (role: UserRole) => void;
}

const BRAND_SWATCHES = [
  { name: 'Primary Navy', hex: '#0C0843' },
  { name: 'Secondary Navy', hex: '#17134F' },
  { name: 'Primary Gold', hex: '#D2A946' },
  { name: 'Light Gold', hex: '#E5C66F' },
  { name: 'Canvas Background', hex: '#F6F6FA' },
  { name: 'Light Navy', hex: '#EDECF5' },
  { name: 'Soft Gold', hex: '#FBF6E9' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users,
  currentUser,
  userRole,
  isFirebaseAuthenticated,
  importLogs,
  dataQualityIssues,
  onSaveSettings,
  onUpdateUserRole,
  onReseedOriginalDataset,
  onPreviewRoleChange,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [form, setForm] = useState<WorkspaceSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [reseeding, setReseeding] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 240000) {
      setSavedNotice('Logo file must be under 240KB so it persists cleanly in Firestore.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, logoDataUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedNotice(null);
    try {
      await onSaveSettings(form);
      setSavedNotice('Settings saved successfully.');
    } finally {
      setSaving(false);
    }
  };

  const handleReseed = async () => {
    setReseeding(true);
    try {
      await onReseedOriginalDataset();
      setSavedNotice('Original 278-employee ALERT MFB dataset restored.');
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-xs text-[#166534] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Company Information & Official Logo */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E5ED] pb-4">
          <div className="flex items-center gap-4">
            <BrandLogo logoUrl={form.logoDataUrl} size="lg" />
            <div>
              <h2 className="font-display text-base font-bold text-[#0C0843]">
                {form.companyName}
              </h2>
              <p className="text-xs text-[#6B6B80]">{form.applicationName}</p>
              <p className="text-xs font-medium text-[#8C6812] mt-0.5">{form.tagline}</p>
            </div>
          </div>

          {perms.canManageSettingsUsers && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946] rounded-lg cursor-pointer hover:bg-[#F5E8C5]">
                <Upload className="w-3.5 h-3.5" />
                Upload Official Logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {form.logoDataUrl && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, logoDataUrl: '' }))}
                  className="px-3 py-2 text-xs font-semibold text-[#6B6B80] bg-white border border-[#E6E5ED] rounded-lg cursor-pointer"
                >
                  Reset Default
                </button>
              )}
            </div>
          )}
        </div>

        {/* Brand Palette */}
        <div>
          <p className="text-xs font-semibold text-[#0C0843] flex items-center gap-1.5 mb-2.5">
            <Palette className="w-3.5 h-3.5 text-[#D2A946]" />
            Official ALERT MFB Brand Colour Palette
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {BRAND_SWATCHES.map((s) => (
              <div
                key={s.hex}
                className="border border-[#E6E5ED] rounded-lg p-2 bg-[#F6F6FA] flex items-center gap-2"
              >
                <span
                  className="w-6 h-6 rounded border border-black/10 shrink-0"
                  style={{ backgroundColor: s.hex }}
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#17172B] truncate">{s.name}</p>
                  <p className="text-[10px] font-mono text-[#6B6B80]">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Format & Notification Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#E6E5ED]">
          <div>
            <label className="block text-xs font-semibold text-[#0C0843] mb-1.5">
              Display Date Format
            </label>
            <select
              disabled={!perms.canManageSettingsUsers}
              value={form.dateFormat}
              onChange={(e) =>
                setForm((p) => ({ ...p, dateFormat: e.target.value as DateFormatOption }))
              }
              className="w-full px-3 py-2 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg disabled:opacity-60"
            >
              <option value="DD MMM YYYY">DD MMM YYYY (e.g. 22 Nov 2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 22/11/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-22)</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#0C0843]">HR Alert Preferences (In-App)</p>
            {(
              [
                ['notifyProbation7d', 'Probation ending within 7 days'],
                ['notifyProbation30d', 'Probation ending within 30 days'],
                ['notifyOverdue', 'Overdue probation & confirmations'],
                ['notifyBirthdays', 'Upcoming birthdays within 30 days'],
                ['notifyDataQuality', 'Data quality & duplicate staff code alerts'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-[#17172B] cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!perms.canManageSettingsUsers}
                  checked={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {perms.canManageSettingsUsers && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0C0843] rounded-lg hover:bg-[#17134F] disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Organization Settings'}
            </button>
          </div>
        )}
      </div>

      {/* RBAC Permissions Matrix & Role Simulation */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#0C0843] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D2A946]" />
              Role-Based Access Control (RBAC)
            </h2>
            <p className="text-xs text-[#6B6B80]">
              Active session role:{' '}
              <strong className="text-[#0C0843]">{ROLE_PERMISSIONS[userRole].label}</strong>
            </p>
          </div>

          {(currentUser?.role === 'super_admin' || !isFirebaseAuthenticated) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B6B80]">Preview UI as Role:</span>
              <select
                value={userRole}
                onChange={(e) => onPreviewRoleChange(e.target.value as UserRole)}
                className="px-2.5 py-1.5 bg-[#FBF6E9] border border-[#D2A946] rounded-lg text-xs font-semibold text-[#0C0843]"
              >
                <option value="super_admin">Super Administrator</option>
                <option value="hr_admin">HR Administrator</option>
                <option value="hr_officer">HR Officer</option>
                <option value="read_only">Read-Only Management User</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map((roleKey) => {
            const r = ROLE_PERMISSIONS[roleKey];
            return (
              <div
                key={roleKey}
                className={`p-4 rounded-xl border ${
                  userRole === roleKey
                    ? 'border-[#0C0843] bg-[#EDECF5]/50'
                    : 'border-[#E6E5ED] bg-[#F6F6FA]'
                }`}
              >
                <p className="text-xs font-bold text-[#0C0843]">{r.label}</p>
                <p className="text-[11px] text-[#6B6B80] mt-1 leading-relaxed">{r.description}</p>
              </div>
            );
          })}
        </div>

        {/* Registered Users Table (when Firebase authenticated) */}
        <div className="pt-4 border-t border-[#E6E5ED]">
          <h3 className="font-display text-sm font-bold text-[#0C0843] flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#D2A946]" />
            Registered Portal Users ({users.length})
          </h3>
          {!isFirebaseAuthenticated ? (
            <p className="text-xs text-[#6B6B80]">
              Sign in with Google Workspace to manage live user accounts and Firestore role
              assignments.
            </p>
          ) : users.length === 0 ? (
            <p className="text-xs text-[#6B6B80]">No user profiles loaded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F6F6FA] border-b border-[#E6E5ED] text-[#6B6B80]">
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Role</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E5ED]">
                  {users.map((u) => (
                    <tr key={u.uid}>
                      <td className="px-3 py-2 font-semibold text-[#17172B]">{u.displayName}</td>
                      <td className="px-3 py-2 text-[#6B6B80]">{u.email}</td>
                      <td className="px-3 py-2">
                        {currentUser?.role === 'super_admin' && u.uid !== currentUser.uid ? (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              onUpdateUserRole(u, e.target.value as UserRole, u.status)
                            }
                            className="px-2 py-1 bg-white border border-[#E6E5ED] rounded text-xs"
                          >
                            <option value="super_admin">Super Administrator</option>
                            <option value="hr_admin">HR Administrator</option>
                            <option value="hr_officer">HR Officer</option>
                            <option value="read_only">Read-Only Management User</option>
                          </select>
                        ) : (
                          <span className="font-medium text-[#0C0843]">
                            {ROLE_PERMISSIONS[u.role].label}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {currentUser?.role === 'super_admin' && u.uid !== currentUser.uid ? (
                          <select
                            value={u.status}
                            onChange={(e) =>
                              onUpdateUserRole(
                                u,
                                u.role,
                                e.target.value as 'active' | 'suspended'
                              )
                            }
                            className="px-2 py-1 bg-white border border-[#E6E5ED] rounded text-xs"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        ) : (
                          <span className="capitalize text-[#166534] font-semibold">{u.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Management & Quality Monitoring */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-sm font-bold text-[#0C0843]">
            Dataset &amp; Quality Monitoring Summary
          </h3>
          <p className="text-xs text-[#6B6B80] mt-1">
            Data Quality Findings: <strong className="text-[#0C0843]">{dataQualityIssues.length}</strong>{' '}
            · Recorded Imports: <strong className="text-[#0C0843]">{importLogs.length}</strong>
          </p>
        </div>
        {perms.canManageSettingsUsers && (
          <button
            type="button"
            disabled={reseeding}
            onClick={handleReseed}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0C0843] bg-[#FBF6E9] border border-[#D2A946] rounded-lg hover:bg-[#F5E8C5] disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            {reseeding ? 'Restoring Dataset...' : 'Restore Original 278-Row Dataset'}
          </button>
        )}
      </div>
    </div>
  );
};
