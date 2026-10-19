import { useId } from 'react';

// The Spill the Genes mark: a blue-to-green teacup with a DNA double helix rising out of it as steam.
// The helix turns continuously (CSS in index.css, `.logo-helix`) and holds still under reduced motion.
// A still frame of the same geometry is in design/logo.svg (favicon, app icon and share image).
const HELIX_PAIRS = 6;

export default function LogoMark({ className = 'h-9 w-9', animated = true }) {
  const gradient = `cup-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 select-none ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3283f8" />
          <stop offset="1" stopColor="#10b98a" />
        </linearGradient>
      </defs>
      <g className={animated ? 'logo-helix' : 'logo-helix logo-helix-still'}>
        {Array.from({ length: HELIX_PAIRS }, (_, i) => (
          <g key={i} style={{ '--i': i }} transform={`translate(21 ${3.6 + i * 4})`}>
            <line className="logo-rung" x1="-5.5" x2="5.5" y1="0" y2="0" />
            <circle className="logo-a" r="1.9" />
            <circle className="logo-b" r="1.9" />
          </g>
        ))}
      </g>
      {/* Cup, handle, rim and saucer. */}
      <path d="M7 28.5h28v4.5a14 14 0 0 1-28 0z" fill={`url(#${gradient})`} />
      <path d="M35 31h2.2a4.6 4.6 0 0 1 0 9.2H33" fill="none" stroke={`url(#${gradient})`} strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="21" cy="28.6" rx="14" ry="2.1" fill="#0b182b" opacity=".16" />
      <path d="M5 46.2h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".18" />
    </svg>
  );
}
