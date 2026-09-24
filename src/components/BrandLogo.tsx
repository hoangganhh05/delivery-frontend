import { useId } from "react";
import { BRAND_NAME } from "../config/brand";

interface BrandLogoProps {
  size?: number;
  className?: string;
  title?: string;
}

export default function BrandLogo({ size = 36, className = "", title = BRAND_NAME }: BrandLogoProps) {
  const instanceId = useId().replace(/:/g, "");
  const gradientId = `giaotin-mark-${instanceId}`;
  const shadowId = `giaotin-shadow-${instanceId}`;

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
          <stop stopColor="#38BDF8" />
          <stop offset="0.5" stopColor="#2563EB" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <filter id={shadowId} x="-8" y="-6" width="80" height="82" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0F3D67" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${shadowId})`}>
        <rect x="4" y="4" width="56" height="56" rx="17" fill={`url(#${gradientId})`} />
        <rect x="4.75" y="4.75" width="54.5" height="54.5" rx="16.25" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
      </g>
      <path d="M17 23.5 32 15l15 8.5v17L32 49l-15-8.5v-17Z" fill="white" fillOpacity="0.96" />
      <path d="m17 23.5 15 8.7 15-8.7M32 32.2V49" stroke="#BFDBFE" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="m25 19 15 8.5v6.8" stroke="#2563EB" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m39.2 32.2.8 2.1 2.2.2-1.7 1.4.5 2.2-1.8-1.2-1.9 1.2.6-2.1-1.7-1.4Z" fill="#0F766E" />
    </svg>
  );
}
