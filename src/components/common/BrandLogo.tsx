import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base font-bold tracking-tight',
    md: 'text-lg font-bold tracking-tight',
    lg: 'text-2xl font-extrabold tracking-tight',
  };

  const subSizes = {
    sm: 'text-[9px] tracking-[0.2em]',
    md: 'text-[10px] tracking-[0.25em]',
    lg: 'text-xs tracking-[0.28em]',
  };

  return (
    <div className="flex items-center gap-2.5 select-none" id="brand-logo-container">
      {/* Visual Glassmorphic App Icon */}
      <div
        className={`${iconSizes[size]} relative rounded-xl p-[1px] bg-gradient-to-br from-emerald-400/40 via-emerald-500/10 to-transparent shadow-lg shadow-emerald-500/10 flex-shrink-0`}
      >
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#0c1c28] via-[#091420] to-[#060b13] flex items-center justify-center overflow-hidden border border-emerald-500/20">
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%]" fill="none">
            {/* Ambient Streak */}
            <path d="M15 75 Q40 50 85 20" stroke="#10b981" strokeOpacity="0.25" strokeWidth="2.5" />
            {/* White F */}
            <path
              d="M28 22 C28 20 30 18 33 18 L70 18 C72 18 74 20 73 23 L70 32 C69 34 67 35 64 35 L44 35 L44 43 L60 43 C62 43 64 45 63 48 L60 56 C59 58 57 59 54 59 L44 59 L44 80 C44 82 42 84 39 84 L33 84 C30 84 28 82 28 80 Z"
              fill="#ffffff"
            />
            {/* Ascending Emerald Financial Bars */}
            <rect x="46" y="66" width="6" height="18" rx="2.5" fill="#10b981" />
            <rect x="55" y="58" width="6" height="26" rx="2.5" fill="#22c55e" />
            <rect x="64" y="50" width="6" height="34" rx="2.5" fill="#34d399" />
            <rect x="73" y="42" width="6" height="42" rx="2.5" fill="#4ade80" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`${titleSizes[size]} text-white leading-none font-sans`}>
          FINANGENCY
        </span>
        {showSubtitle && (
          <span className={`${subSizes[size]} text-emerald-400/90 font-semibold uppercase mt-0.5`}>
            Gestão Financeira
          </span>
        )}
      </div>
    </div>
  );
};
