import React from 'react';

interface LogoMakarimaProps {
  className?: string;
  size?: number;
}

export const LogoMakarima: React.FC<LogoMakarimaProps> = ({ 
  className = "w-10 h-10", 
  size = 48 
}) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="shrink-0 select-none drop-shadow-xs"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle drop shadow */}
          <filter id="makarimaShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer 8-Pointed Star (Rub el Hizb style Islamic star) */}
        {/* First square (green) */}
        <rect
          x="30"
          y="30"
          width="140"
          height="140"
          rx="12"
          fill="#15803D"
          stroke="#047857"
          strokeWidth="3"
        />
        {/* Second rotated 45deg square (green) */}
        <rect
          x="30"
          y="30"
          width="140"
          height="140"
          rx="12"
          transform="rotate(45 100 100)"
          fill="#15803D"
          stroke="#047857"
          strokeWidth="3"
        />

        {/* Inner Gold Star Contour */}
        <rect
          x="38"
          y="38"
          width="124"
          height="124"
          rx="8"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2.5"
        />
        <rect
          x="38"
          y="38"
          width="124"
          height="124"
          rx="8"
          transform="rotate(45 100 100)"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2.5"
        />

        {/* Central White Circular Medallion */}
        <circle cx="100" cy="100" r="54" fill="#FFFFFF" stroke="#047857" strokeWidth="2.5" />

        {/* Golden Crescent Moon */}
        <path
          d="M 94,62 C 70,64 56,84 58,106 C 60,126 78,142 100,140 C 112,139 122,132 128,124 C 114,130 96,124 90,112 C 84,100 86,82 102,70 C 99,66 96,63 94,62 Z"
          fill="#EAB308"
          stroke="#CA8A04"
          strokeWidth="1.2"
        />

        {/* Torch / Flame & Book / Star emblem */}
        <g transform="translate(100, 94)">
          {/* Torch Flame */}
          <path
            d="M 0,-24 C -6,-16 -8,-6 -4,0 C 0,5 6,5 10,0 C 14,-6 8,-16 0,-24 Z"
            fill="#EF4444"
          />
          <path
            d="M 0,-18 C -3,-12 -4,-4 -1,0 C 2,3 6,3 8,0 C 10,-4 5,-12 0,-18 Z"
            fill="#FBBF24"
          />
          {/* Torch Handle */}
          <polygon points="-3,0 3,0 1.5,14 -1.5,14" fill="#D97706" />
          
          {/* Open Quran Book */}
          <path
            d="M -16,14 C -8,11 0,14 0,14 C 0,14 8,11 16,14 L 14,22 C 7,19 0,22 0,22 C 0,22 -7,19 -14,22 Z"
            fill="#0284C7"
            stroke="#0369A1"
            strokeWidth="1"
          />
        </g>

        {/* Bottom Banner Ribbon with "MAKARIMA" */}
        <g transform="translate(0, 24)">
          {/* Ribbon Tail Left */}
          <polygon points="20,138 38,130 38,148 20,154 28,146" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
          {/* Ribbon Tail Right */}
          <polygon points="180,138 162,130 162,148 180,154 172,146" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />

          {/* Main Ribbon Body */}
          <path
            d="M 32,130 C 70,122 130,122 168,130 L 164,152 C 128,144 72,144 36,152 Z"
            fill="#0F172A"
            stroke="#D4AF37"
            strokeWidth="1.5"
          />

          {/* Ribbon Text */}
          <text
            x="100"
            y="144"
            fill="#FFFFFF"
            fontFamily="'Arial Black', 'Montserrat', sans-serif"
            fontWeight="900"
            fontSize="10.5"
            letterSpacing="2.2"
            textAnchor="middle"
          >
            MAKARIMA
          </text>
        </g>
      </svg>
    </div>
  );
};
