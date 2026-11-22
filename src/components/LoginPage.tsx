import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye, ArrowRight, Database } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface LoginPageProps {
  logoUrl?: string;
  onGoogleSignIn: () => Promise<void>;
  onEnterPreview: () => void;
  authError: string | null;
  isSigningIn: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  logoUrl,
  onGoogleSignIn,
  onEnterPreview,
  authError,
  isSigningIn,
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const handleGoogle = async () => {
    setLocalLoading(true);
    try {
      await onGoogleSignIn();
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0843] flex flex-col lg:flex-row">
      {/* Left Brand Showcase */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="flex items-center gap-4">
          <BrandLogo logoUrl={logoUrl} size="lg" variant="dark" />
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-white">ALERT MFB</p>
            <p className="text-sm text-[#E5C66F]">Empowering People. Building Excellence.</p>
          </div>
        </div>

        <div className="my-12 max-w-xl">
          <p className="text-xs font-medium tracking-wider uppercase text-[#D2A946] mb-3">
            Enterprise Human Resources Management Information System
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold leading-tight text-white mb-5 [text-wrap:balance]">
            Workforce Governance, Probation Oversight &amp; HR Analytics
          </h1>
          <p className="text-sm lg:text-base text-[#EDECF5]/85 leading-relaxed mb-8">
            Centralized employee directory, 6-month probation milestone monitoring, confirmation
            compliance tracking, data quality auditing, and executive reporting for ALERT MFB
            branches and head office.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/15">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#D2A946] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Role-Based Access Control</p>
                <p className="text-xs text-[#EDECF5]/75 mt-0.5">
                  Enforced Firestore rules across Super Admin, HR Admin, HR Officer &amp; Management
                  roles.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-[#D2A946] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Live Dataset Synchronization</p>
                <p className="text-xs text-[#EDECF5]/75 mt-0.5">
                  Backed by real-time Firebase Firestore storage and SheetJS Excel/CSV ingestion.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#EDECF5]/60">
          © {new Date().getFullYear()} ALERT MFB | Human Resources Management System
        </p>
      </div>

      {/* Right Authentication Card */}
      <div className="lg:w-1/2 bg-[#F6F6FA] flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md bg-white border border-[#E6E5ED] rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BrandLogo logoUrl={logoUrl} size="md" />
            <div>
              <h2 className="font-display text-xl font-bold text-[#0C0843]">
                HR Portal Sign In
              </h2>
              <p className="text-xs text-[#6B6B80]">ALERT MFB – HR Management System</p>
            </div>
          </div>

          <div className="h-px bg-[#E6E5ED] mb-6" />

          {authError && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B]">
              {authError}
            </div>
          )}

          <button
            type="button"
            disabled={isSigningIn || localLoading}
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#0C0843] text-white text-sm font-semibold hover:bg-[#17134F] transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#D2A946]" />
            <span>
              {isSigningIn || localLoading
                ? 'Authenticating with Firebase...'
                : 'Sign In with Google Workspace'}
            </span>
          </button>

          <p className="text-xs text-[#6B6B80] mt-3 leading-relaxed">
            Sign in with your authorized corporate Google account to enable persistent Firebase
            Firestore storage, audit logging, and role-based HR administration.
          </p>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E6E5ED]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#6B6B80]">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onEnterPreview}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#FBF6E9] border border-[#D2A946]/60 text-[#0C0843] text-sm font-semibold hover:bg-[#F6ECD0] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#8C6812]" />
              <span>Open Local Dataset Session (In-Memory)</span>
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-[#6B6B80] mt-3 leading-relaxed">
            Local session loads the 278-employee ALERT MFB dataset in browser memory for analysis
            and reporting. Changes made in local mode are not persisted to Firestore until you sign
            in.
          </p>
        </div>
      </div>
    </div>
  );
};
