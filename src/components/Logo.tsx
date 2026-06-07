"use client";

import { useState } from "react";

/**
 * Logo de la Quiniela Mundial 2026.
 * Usa el logo oficial en /brand/wc2026-white.svg si existe;
 * si no, cae en un emblema original propio (sin marcas registradas).
 */
export function Logo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/wc2026-white.svg"
        alt="Mundial 2026"
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: "contain" }}
        onError={() => setFailed(true)}
      />
    );
  }

  return <FallbackEmblem size={size} className={className} />;
}

function FallbackEmblem({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="qm-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="13"
        fill="#0f1838"
        stroke="url(#qm-grad)"
        strokeWidth="2.5"
      />
      <g fill="url(#qm-grad)">
        <path d="M17 12h14v5c0 3.6-2.6 6.2-6 6.2h-2c-3.4 0-6-2.6-6-6.2v-5z" />
        <rect x="22.6" y="22.5" width="2.8" height="5" rx="1" />
        <rect x="18" y="30.5" width="12" height="2.8" rx="1.4" />
        <rect x="20" y="27" width="8" height="2.6" rx="1.3" />
      </g>
      <path
        d="M17 13.5c-3.2 0-5 1.6-5 4.2s1.8 4 4.4 4"
        stroke="url(#qm-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M31 13.5c3.2 0 5 1.6 5 4.2s-1.8 4-4.4 4"
        stroke="url(#qm-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <text
        x="24"
        y="42"
        textAnchor="middle"
        fontSize="9"
        fontWeight="900"
        fill="#ffffff"
        fontFamily="system-ui, sans-serif"
      >
        26
      </text>
    </svg>
  );
}
