import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  GitBranch,
  MapPin,
  BarChart3,
  Clock,
  CheckSquare,
  Bell,
  FileSpreadsheet,
  Database,
  Settings,
  X,
} from 'lucide-react';
import { NavPage } from '../types/hr';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activePage: NavPage;
  onSelectPage: (page: NavPage) => void;
  alertCount: number;
  logoUrl?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Employee Directory', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'job_roles', label: 'Job Roles', icon: Briefcase },
    { id: 'subsidiaries', label: 'Subsidiaries', icon: GitBranch },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'analytics', label: 'HR Analytics', icon: BarChart3 },
    { id: 'probation', label: 'Probation Management', icon: Clock },
    { id: 'confirmation', label: 'Confirmation Management', icon: CheckSquare },
    { id: 'alerts', label: 'HR Alerts', icon: Bell },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'data_management', label: 'Data Management', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  alertCount,
  logoUrl,
  mobileOpen,
  onCloseMobile,
}) => {
  const content = (
    <aside className="w-[264px] h-full bg-[#0C0843] text-white flex flex-col border-r border-[#17134F]">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo logoUrl={logoUrl} size="md" variant="dark" />
          <div className="min-w-0">
            <p className="font-display text-base font-bold tracking-tight text-white truncate">
              ALERT MFB
            </p>
            <p className="text-[11px] text-[#E5C66F] truncate">HR Management System</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectPage(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[#D2A946] text-[#0C0843] font-semibold'
                  : 'text-[#EDECF5]/85 hover:bg-[#17134F] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#0C0843]' : 'text-[#E5C66F]'
                  }`}
                />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
              {item.id === 'alerts' && alertCount > 0 && (
                <span
                  className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? 'bg-[#0C0843] text-[#E5C66F]'
                      : 'bg-[#17134F] text-[#E5C66F] border border-[#D2A946]/40'
                  }`}
                >
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Brand Footer */}
      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-[#EDECF5]/70">
        <p className="font-medium text-[#E5C66F]">Empowering People.</p>
        <p>Building Excellence.</p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-[264px] no-print">
        {content}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-[#0C0843]/60 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
};
