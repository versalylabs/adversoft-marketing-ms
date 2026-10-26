import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

/**
 * Adversoft Billboard & Digital Signage Vector Icon
 * Clean high-impact outdoor media display with illuminated "A" monogram and support monolith.
 */
export function AdversoftLogoIcon({ size = 24, className = '', ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="advIconBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        <linearGradient id="advIconBorder" x1="8" y1="8" x2="56" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="advIconScreen" x1="10" y1="10" x2="54" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B0F19" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        <linearGradient id="advIconAccent" x1="20" y1="16" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        <filter id="advIconGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#4338CA" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Squircle Base */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#advIconBg)" filter="url(#advIconGlow)" />
      <rect x="3" y="3" width="58" height="58" rx="15" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5" />

      {/* Billboard Screen Frame */}
      <rect
        x="9"
        y="10"
        width="46"
        height="28"
        rx="5"
        fill="url(#advIconScreen)"
        stroke="url(#advIconBorder)"
        strokeWidth="2"
      />

      {/* Support Monolith Pillar & Shading */}
      <rect x="29" y="38" width="6" height="13" rx="1.5" fill="#E0E7FF" fillOpacity="0.95" />
      <rect x="32" y="38" width="3" height="13" rx="1" fill="#A5B4FC" fillOpacity="0.85" />

      {/* Ground Foundation Base Plate */}
      <rect x="20" y="50" width="24" height="4.5" rx="2.25" fill="#E0E7FF" fillOpacity="0.95" />

      {/* Illuminated Monogram "A" */}
      <path
        d="M 23 32 L 32 17 L 41 32"
        stroke="url(#advIconAccent)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 26.5 27.5 L 37.5 27.5" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Top Broadcast Beacon Sparkle */}
      <circle cx="32" cy="17" r="2" fill="#F8FAFC" />
      <circle cx="32" cy="17" r="3.5" fill="#38BDF8" fillOpacity="0.45" />

      {/* Display LED Grid Hints */}
      <circle cx="14" cy="15" r="1" fill="#818CF8" fillOpacity="0.8" />
      <circle cx="18" cy="15" r="1" fill="#818CF8" fillOpacity="0.8" />
      <circle cx="46" cy="15" r="1" fill="#818CF8" fillOpacity="0.8" />
      <circle cx="50" cy="15" r="1" fill="#818CF8" fillOpacity="0.8" />
    </svg>
  );
}

/**
 * Adversoft Brand Mark with Title and Subtitle
 */
export function AdversoftLogo({
  size = 36,
  showText = true,
  subtitle = 'Outdoor Media Management',
  className = '',
}: {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <AdversoftLogoIcon size={size} className="shrink-0 drop-shadow-xs" />
      {showText && (
        <div className="flex flex-col min-w-0">
          <span className="text-base font-extrabold tracking-tight text-gray-900 leading-tight">
            Adversoft<span className="text-indigo-600">.</span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 truncate -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default AdversoftLogoIcon;
