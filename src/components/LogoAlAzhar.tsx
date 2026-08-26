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
          {/* Top text curved path */}
          <path
            id="topTextPath"
            d="M 90.26,361.85 A 195,195 0 1,1 409.74,361.85"
            fill="none"
          />
          {/* Bottom text curved path */}
          <path
            id="bottomTextPath"
            d="M 409.74,361.85 A 206,206 0 0,1 90.26,361.85"
            fill="none"
          />
          <clipPath id="innerCircleClip">
            <circle cx="250" cy="250" r="166" />
          </clipPath>
        </defs>

        {/* Outer White Background Ring & Outermost Black Border */}
        <circle cx="250" cy="250" r="242" fill="#FFFFFF" stroke="#000000" strokeWidth="12" />

        {/* Inner Border Ring */}
        <circle cx="250" cy="250" r="172" fill="none" stroke="#000000" strokeWidth="10" />

        {/* Inner Sky Blue Circle */}
        <circle cx="250" cy="250" r="166" fill="#0082C8" />

        {/* Top Arc Text: SEKOLAH MENENGAH PERTAMA ISLAM */}
        <text
          fill="#000000"
          fontFamily="'Arial Black', 'Montserrat', 'Trebuchet MS', sans-serif"
          fontWeight="900"
          fontSize="28"
          letterSpacing="2.6"
        >
          <textPath
            href="#topTextPath"
            startOffset="50%"
            textAnchor="middle"
          >
            SEKOLAH MENENGAH PERTAMA ISLAM
          </textPath>
        </text>

        {/* Bottom Arc Text: AL AZHAR 21 */}
        <text
          fill="#000000"
          fontFamily="'Arial Black', 'Montserrat', 'Trebuchet MS', sans-serif"
          fontWeight="900"
          fontSize="38"
          letterSpacing="4.2"
        >
          <textPath
            href="#bottomTextPath"
            startOffset="50%"
            textAnchor="middle"
          >
            AL AZHAR 21
          </textPath>
        </text>

        {/* --- MOSQUE & MINARET GRAPHICS --- */}
        <g id="mosque-graphics">
          <g clipPath="url(#innerCircleClip)">
            {/* Mosque Base / Ground Wall */}
            <path
              d="M 80,420 L 420,420 L 420,344 L 388,344 C 388,344 388,370 365,370 L 260,370 L 260,358 L 244,358 L 244,374 L 180,374 L 138,374 L 138,420 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
              strokeLinejoin="round"
            />

            {/* Left Minaret Tower Body */}
            <rect
              x="138"
              y="186"
              width="43"
              height="188"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
            />

            {/* Minaret Balcony Upper Ring */}
            <rect
              x="134"
              y="171"
              width="51"
              height="16"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
              strokeLinejoin="round"
            />

            {/* Minaret 4 Windows */}
            <rect x="140" y="174.5" width="6.5" height="9.5" fill="#0082C8" stroke="#000000" strokeWidth="2.4" />
            <rect x="149.5" y="174.5" width="6.5" height="9.5" fill="#0082C8" stroke="#000000" strokeWidth="2.4" />
            <rect x="159" y="174.5" width="6.5" height="9.5" fill="#0082C8" stroke="#000000" strokeWidth="2.4" />
            <rect x="168.5" y="174.5" width="6.5" height="9.5" fill="#0082C8" stroke="#000000" strokeWidth="2.4" />

            {/* Minaret Dome Top */}
            <path
              d="M 138,171 C 138,142 159.5,122 159.5,122 C 159.5,122 181,142 181,171 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
              strokeLinejoin="round"
            />
            
            {/* Minaret Finial Pin */}
            <line x1="159.5" y1="122" x2="159.5" y2="112" stroke="#000000" strokeWidth="5" strokeLinecap="round" />

            {/* Minaret Lower Base L-cuts */}
            <path
              d="M 181,358 L 260,358 L 260,374 L 181,374 Z"
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

            {/* Main Central Dome */}
            <path
              d="M 244,342 C 244,228 313,202 313,202 C 313,202 386,228 386,342 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="7"
              strokeLinejoin="round"
            />

            {/* Crescent Moon & 5-Pointed Star Finial on Main Dome */}
            <g transform="translate(313, 180)">
              {/* Crescent Moon */}
              <path
                d="M 3,-18 C -14,-18 -26,-6 -26,10 C -26,26 -14,38 3,38 C -6,32 -13,22 -13,10 C -13,-2 -6,-12 3,-18 Z"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              {/* 5-point Star inside Crescent */}
              <path
                d="M 6,3 L 8.5,-4 L 14.5,-4 L 9.5,-8 L 11.5,-15 L 6,-11 L 0.5,-15 L 2.5,-8 L -2.5,-4 L 3.5,-4 Z"
                transform="translate(4, 8) scale(1.15)"
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
