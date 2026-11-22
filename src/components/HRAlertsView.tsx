import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, Info, Search } from 'lucide-react';
import {
  AlertCategory,
  AlertItem,
  AlertReview,
  EmployeeComputed,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types/hr';

interface HRAlertsViewProps {
  alerts: AlertItem[];
  reviews: AlertReview[];
  employees: EmployeeComputed[];
  userRole: UserRole;
  onReviewAlert: (alert: AlertItem) => Promise<void>;
  onSelectEmployee: (emp: EmployeeComputed) => void;
}

const CATEGORIES: ('ALL' | AlertCategory)[] = [
  'ALL',
  'Probation Ending Within 7 Days',
  'Probation Ending Within 30 Days',
  'Overdue Probation',
  'Awaiting Confirmation',
  'Overdue Confirmation',
  'Upcoming Birthdays (30 Days)',
  'Duplicate Staff Codes',
  'Invalid Date Records',
  'Missing Employee Information',
];

export const HRAlertsView: React.FC<HRAlertsViewProps> = ({
  alerts,
  reviews,
  employees,
  userRole,
  onReviewAlert,
  onSelectEmployee,
}) => {
  const perms = ROLE_PERMISSIONS[userRole];
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | AlertCategory>('ALL');
  const [showReviewed, setShowReviewed] = useState<'UNREVIEWED' | 'ALL' | 'REVIEWED'>('UNREVIEWED');
  const [search, setSearch] = useState('');
  const [reviewingKey, setReviewingKey] = useState<string | null>(null);

  const reviewedMap = useMemo(() => {
    const map = new Map<string, AlertReview>();
    reviews.forEach((r) => map.set(r.alertKey, r));
    return map;
  }, [reviews]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    alerts.forEach((a) => {
      if (!reviewedMap.has(a.alertKey)) {
        counts.set(a.category, (counts.get(a.category) || 0) + 1);
      }
    });
    return counts;
  }, [alerts, reviewedMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts.filter((a) => {
      const isRev = reviewedMap.has(a.alertKey);
      if (showReviewed === 'UNREVIEWED' && isRev) return false;
      if (showReviewed === 'REVIEWED' && !isRev) return false;
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
      if (q) {
        const hay = `${a.employeeName} ${a.staffCode} ${a.category} ${a.details}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [alerts, reviewedMap, showReviewed, selectedCategory, search]);

  const handleMarkReviewed = async (alert: AlertItem) => {
    setReviewingKey(alert.alertKey);
    try {
      await onReviewAlert(alert);
    } finally {
      setReviewingKey(null);
    }
  };

  const priorityClass = (p: AlertItem['priority']) => {
    if (p === 'Critical') return 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]';
    if (p === 'High') return 'bg-[#FEF3C7] text-[#92400E] border-[#D2A946]';
    if (p === 'Medium') return 'bg-[#EDECF5] text-[#0C0843] border-[#0C0843]/20';
    return 'bg-[#F6F6FA] text-[#6B6B80] border-[#E6E5ED]';
  };

  return (
    <div className="space-y-5">
      {/* Honest In-App Notice */}
      <div className="bg-[#EDECF5] border border-[#0C0843]/15 rounded-xl px-4 py-3 text-xs text-[#0C0843] flex items-center gap-2.5">
        <Info className="w-4 h-4 text-[#0C0843] shrink-0" />
        <span>
          <strong>In-App Notifications Mode:</strong> External email/SMTP dispatch is not
          configured. All HR alerts are actively monitored and acknowledged inside this portal.
        </span>
      </div>

      {/* Category Chips */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D2A946]" />
            <h2 className="font-display text-sm font-bold text-[#0C0843]">
              Alert Categories (Unreviewed Counts)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {(['UNREVIEWED', 'ALL', 'REVIEWED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setShowReviewed(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  showReviewed === tab
                    ? 'bg-[#0C0843] text-white'
                    : 'bg-[#F6F6FA] text-[#6B6B80] hover:text-[#0C0843]'
                }`}
              >
                {tab === 'UNREVIEWED' ? 'Pending Review' : tab === 'ALL' ? 'All Alerts' : 'Reviewed'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const count =
              cat === 'ALL'
                ? alerts.filter((a) => !reviewedMap.has(a.alertKey)).length
                : categoryCounts.get(cat) || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#D2A946] text-[#0C0843] font-semibold'
                    : 'bg-[#F6F6FA] text-[#6B6B80] hover:text-[#0C0843]'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-[#6B6B80] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts by employee, staff code, or details..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg"
          />
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white border border-[#E6E5ED] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#E6E5ED]">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-xs text-[#6B6B80]">
              No HR alerts in this view.
            </div>
          ) : (
            filtered.slice(0, 120).map((alert) => {
              const review = reviewedMap.get(alert.alertKey);
              const emp = employees.find((e) => e.id === alert.employeeId);
              return (
                <div
                  key={alert.alertKey}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F6F6FA]"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${priorityClass(
                          alert.priority
                        )}`}
                      >
                        {alert.priority}
                      </span>
                      <span className="font-semibold text-[#0C0843]">{alert.category}</span>
                      <span className="text-[#6B6B80]">·</span>
                      <span className="font-mono text-[#6B6B80]">{alert.relevantDate}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => emp && onSelectEmployee(emp)}
                        className="font-bold text-[#0C0843] hover:underline cursor-pointer"
                      >
                        {alert.employeeName}
                      </button>
                      <span className="font-mono text-xs text-[#6B6B80]">
                        ({alert.staffCode})
                      </span>
                      <span className="text-xs text-[#6B6B80]">· {alert.department}</span>
                    </div>

                    <p className="text-xs text-[#17172B]">{alert.details}</p>
                    <p className="text-xs text-[#6B6B80]">
                      <strong className="text-[#0C0843]">Suggested Action:</strong>{' '}
                      {alert.suggestedAction}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {review ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#166534] text-xs font-semibold">
                        <CheckCheck className="w-3.5 h-3.5" />
                        Reviewed by {review.reviewedByEmail.split('@')[0]}
                      </span>
                    ) : (
                      perms.canReviewAlerts && (
                        <button
                          type="button"
                          disabled={reviewingKey === alert.alertKey}
                          onClick={() => handleMarkReviewed(alert)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C0843] text-white text-xs font-semibold hover:bg-[#17134F] disabled:opacity-60 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-[#D2A946]" />
                          {reviewingKey === alert.alertKey ? 'Saving...' : 'Mark Reviewed'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {filtered.length > 120 && (
          <div className="px-4 py-3 bg-[#F6F6FA] border-t border-[#E6E5ED] text-xs text-[#6B6B80] text-center">
            Showing first 120 of {filtered.length} matching alerts. Filter by category or search to
            narrow results.
          </div>
        )}
      </div>
    </div>
  );
};
