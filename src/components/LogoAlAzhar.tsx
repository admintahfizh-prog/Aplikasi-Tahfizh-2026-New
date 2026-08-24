import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const LogoAlAzhar: React.FC<LogoProps> = ({ 
  className = "w-10 h-10", 
  size = 48,
  showText = false 
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 500 500"
        width={size}
        height={size}
        className="shrink-0 select-none drop-shadow-xs"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Circular path for top text */}
          {/* Radius ~ 215, centered at 250,250 */}
          <path
            id="topTextPath"
            d="M 55,250 A 195,195 0 1,1 445,250"
            fill="none"
          />
          {/* Circular path for bottom text */}
          <path
            id="bottomTextPath"
            d="M 445,250 A 195,195 0 0,1 55,250"
            fill="none"
          />
        </defs>

        {/* Outer White Background Ring */}
        <circle cx="250" cy="250" r="242" fill="#FFFFFF" stroke="#000000" strokeWidth="12" />

        {/* Inner Border Ring */}
        <circle cx="250" cy="250" r="172" fill="none" stroke="#000000" strokeWidth="10" />

        {/* Inner Sky Blue Circle */}
        <circle cx="250" cy="250" r="167" fill="#0088D2" />

        {/* Text Around Circle - Top: SEKOLAH MENENGAH PERTAMA ISLAM */}
        <text
          fill="#000000"
          fontFamily="'Arial Black', 'Montserrat', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="30.5"
          letterSpacing="2.8"
        >
          <textPath
            href="#topTextPath"
            startOffset="50%"
            textAnchor="middle"
          >
            SEKOLAH MENENGAH PERTAMA ISLAM
          </textPath>
        </text>

        {/* Text Around Circle - Bottom: AL AZHAR 21 */}
        <text
          fill="#000000"
          fontFamily="'Arial Black', 'Montserrat', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="40"
          letterSpacing="4"
        >
          <textPath
            href="#bottomTextPath"
            startOffset="50%"
            textAnchor="middle"
          >
            AL AZHAR 21
          </textPath>
        </text>

        {/* --- MOSQUE ARTWORK (WHITE WITH BLACK OUTLINES) --- */}
        <g id="mosque-graphics">
          {/* Clip to inner circle */}
          <clipPath id="innerCircleClip">
            <circle cx="250" cy="250" r="167" />
          </clipPath>

          <g clipPath="url(#innerCircleClip)">
            {/* Mosque Base / Ground Wall */}
            <path
              d="M 83,417 L 417,417 L 417,340 L 365,340 L 365,370 L 260,370 L 260,358 L 244,358 L 244,372 L 180,372 L 180,372 L 138,372 L 138,417 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
              strokeLinejoin="round"
            />

            {/* Left Minaret Tower Body */}
            <rect
              x="138"
              y="188"
              width="43"
              height="184"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
            />

            {/* Minaret Balcony Upper Ring */}
            <rect
              x="135"
              y="173"
              width="49"
              height="16"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
            />

            {/* Minaret 4 Windows (Horizontal stripe cutouts) */}
            <rect x="142" y="176" width="6.5" height="10" fill="#0088D2" stroke="#000000" strokeWidth="2.5" />
            <rect x="151.5" y="176" width="6.5" height="10" fill="#0088D2" stroke="#000000" strokeWidth="2.5" />
            <rect x="161" y="176" width="6.5" height="10" fill="#0088D2" stroke="#000000" strokeWidth="2.5" />
            <rect x="170.5" y="176" width="6.5" height="10" fill="#0088D2" stroke="#000000" strokeWidth="2.5" />

            {/* Minaret Dome Top */}
            <path
              d="M 139,173 C 139,145 159.5,125 159.5,125 C 159.5,125 180,145 180,173 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
              strokeLinejoin="round"
            />
            {/* Minaret Finial Pin */}
            <line x1="159.5" y1="125" x2="159.5" y2="116" stroke="#000000" strokeWidth="5" strokeLinecap="round" />

            {/* Minaret Lower Base L-cut */}
            <path
              d="M 180,358 L 260,358 L 260,372 L 180,372 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
            />
            <path
              d="M 244,342 L 260,342 L 260,358 L 244,358 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
            />

            {/* Main Central/Right Dome */}
            <path
              d="M 244,342 C 244,228 314,204 314,204 C 314,204 384,228 384,342 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
              strokeLinejoin="round"
            />

            {/* Crescent Moon & Star Finial on Main Dome */}
            <g transform="translate(314, 182)">
              {/* Crescent Moon */}
              <path
                d="M 2,-18 C -14,-18 -26,-6 -26,10 C -26,26 -14,38 2,38 C -7,32 -13,22 -13,10 C -13,-2 -7,-12 2,-18 Z"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              {/* 5-point Star inside Crescent */}
              <path
                d="M 6,3 L 8.5,-4 L 14.5,-4 L 9.5,-8 L 11.5,-15 L 6,-11 L 0.5,-15 L 2.5,-8 L -2.5,-4 L 3.5,-4 Z"
                transform="translate(4, 8) scale(1.1)"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-slate-800 leading-tight">
            SMPI AL AZHAR 21
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Tahfizh & Metode Ummi
          </span>
        </div>
      )}
    </div>
  );
};
