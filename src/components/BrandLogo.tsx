import { useId } from "react";
import { BRAND_NAME } from "../config/brand";

interface BrandLogoProps {
  size?: number;
  className?: string;
  title?: string;
}

export default function BrandLogo({ size = 36, className = "", title = BRAND_NAME }: BrandLogoProps) {
  const instanceId = useId().replace(/:/g, "");
  const gradientId = `nexaship-mark-${instanceId}`;
  const shadowId = `nexaship-shadow-${instanceId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradientId} x1="8" y1="6" x2="56" y2="59" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="0.5" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <filter id={shadowId} x="-8" y="-6" width="80" height="82" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#312E81" floodOpacity="0.24" />
        </filter>
      </defs>
      <g filter={`url(#${shadowId})`}>
        <rect x="4" y="4" width="56" height="56" rx="17" fill={`url(#${gradientId})`} />
        <rect x="4.75" y="4.75" width="54.5" height="54.5" rx="16.25" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
      </g>
      <path d="M18 43V21L46 43V21" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="20" r="4.5" fill="white" />
      <circle cx="46" cy="44" r="4.5" fill="#BFDBFE" stroke="white" strokeWidth="2" />
      <path d="M42.5 17.5L46 14L49.5 17.5" stroke="#DBEAFE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
