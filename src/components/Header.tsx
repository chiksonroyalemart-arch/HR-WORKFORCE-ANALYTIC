import React from 'react';
import { Bell, Filter, LogOut, Menu, Search } from 'lucide-react';
import { NavPage, ROLE_PERMISSIONS, UserAccount } from '../types/hr';
import { BrandLogo } from './BrandLogo';
import { DEFAULT_ADMIN_AVATAR_URL } from '../utils/exports';

interface HeaderProps {
  activePage: NavPage;
  logoUrl?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreviewedAlertsCount: number;
  onOpenAlerts: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  currentUser: UserAccount | null;
  isFirebaseAuthenticated: boolean;
  onSignOut: () => void;
  onOpenMobileMenu: () => void;
}

const PAGE_TITLES: Record<NavPage, string> = {
  dashboard: 'Employee HR Analytics Dashboard',
  directory: 'Employee Directory',
  departments: 'Departments Directory',
  job_roles: 'Job Roles Breakdown',
  subsidiaries: 'Subsidiaries Overview',
  locations: 'Branch & Office Locations',
  analytics: 'Workforce Demographics & HR Analytics',
  probation: 'Probation Management',
  confirmation: 'Employee Confirmation Management',
  alerts: 'HR Alerts & Notifications Centre',
  reports: 'Enterprise HR Reports',
  data_management: 'Data Management & Quality Audit',
  settings: 'System Settings & Governance',
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  logoUrl,
  searchQuery,
  onSearchChange,
  unreviewedAlertsCount,
  onOpenAlerts,
  showFilters,
  onToggleFilters,
  activeFilterCount,
  currentUser,
  isFirebaseAuthenticated,
  onSignOut,
  onOpenMobileMenu,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const roleLabel = currentUser
    ? ROLE_PERMISSIONS[currentUser.role].label
    : 'Local Preview Session';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E6E5ED] px-4 sm:px-6 py-3 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu + Brand/Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg border border-[#E6E5ED] text-[#0C0843] hover:bg-[#EDECF5]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden">
            <BrandLogo logoUrl={logoUrl} size="sm" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-bold text-[#0C0843] truncate">
              {PAGE_TITLES[activePage]}
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B6B80]">
              <span>ALERT MFB</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{todayFormatted}</span>
              <span aria-hidden="true">·</span>
              <span>
                {isFirebaseAuthenticated ? 'Firestore Synchronized' : 'In-Memory Session (Unsaved)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Global Search, Filters Toggle, Notifications, Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative hidden md:block w-56 lg:w-64">
            <Search className="w-4 h-4 text-[#6B6B80] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name or staff code..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg text-[#17172B] placeholder:text-[#6B6B80] focus:outline-none focus:border-[#0C0843]"
            />
          </div>

          <button
            type="button"
            onClick={onToggleFilters}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#0C0843] text-white border-[#0C0843]'
                : 'bg-white text-[#0C0843] border-[#E6E5ED] hover:bg-[#EDECF5]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg border border-[#E6E5ED] text-[#0C0843] hover:bg-[#EDECF5] transition-colors cursor-pointer"
            aria-label="View HR Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreviewedAlertsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded bg-[#D2A946] text-[#0C0843] text-[10px] font-mono font-bold tabular-nums flex items-center justify-center">
                {unreviewedAlertsCount > 99 ? '99+' : unreviewedAlertsCount}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-[#E6E5ED]">
            <img
              src={DEFAULT_ADMIN_AVATAR_URL}
              alt="Administrator profile"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-[#E6E5ED]"
            />
            <div className="hidden xl:block text-left leading-tight">
              <p className="text-xs font-semibold text-[#0C0843] max-w-[140px] truncate">
                {currentUser?.displayName || 'Guest Reviewer'}
              </p>
              <p className="text-[11px] text-[#6B6B80] truncate">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title={isFirebaseAuthenticated ? 'Sign out' : 'Exit session'}
              className="p-1.5 rounded-lg text-[#6B6B80] hover:text-[#0C0843] hover:bg-[#EDECF5] transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
