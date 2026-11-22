import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../utils/exports';

interface BrandLogoProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  size = 'md',
  variant = 'light',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const effectiveSrc = logoUrl && logoUrl.trim() ? logoUrl : DEFAULT_LOGO_URL;

  const sizeMap = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  if (imgFailed) {
    return (
      <div
        className={`${sizeMap[size]} rounded-lg flex items-center justify-center shrink-0 border ${
          variant === 'dark'
            ? 'bg-white border-[#D2A946]/40 text-[#0C0843]'
            : 'bg-[#0C0843] border-[#D2A946] text-[#D2A946]'
        } ${className}`}
        aria-label="ALERT MFB Official Logo"
      >
        <Landmark className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-lg overflow-hidden shrink-0 bg-white border border-[#E6E5ED] flex items-center justify-center p-0.5 ${className}`}
    >
      <img
        src={effectiveSrc}
        alt="ALERT MFB Official Logo"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
