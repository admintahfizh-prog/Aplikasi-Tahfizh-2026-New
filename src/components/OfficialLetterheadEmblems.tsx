import React from 'react';
import { ExamCategory } from '../types';

const HIJRI_MONTHS_INDO = [
  'Muharram',
  'Shafar',
  "Rabi'ul Awal",
  "Rabi'ul Akhir",
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  "Sya'ban",
  'Ramadhan',
  'Syawal',
  "Dzulqo'dah",
  'Dzulhijjah'
];

const HIJRI_MONTHS_ARABIC = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function toEasternArabicDigits(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, d => arabicDigits[Number(d)]);
}

/**
 * Compresses an uploaded image File into a crisp dataURL that fits comfortably in localStorage & Firestore.
 */
export function compressUploadedImage(
  file: File,
  maxW = 1400,
  maxH = 1000,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = ev => {
      const rawDataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        // Fill white background for JPEG if not transparent PNG header
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Gregorian YYYY-MM-DD date string into Hijri { day, monthIndex (0-11), year }
 * using the standard Kuwaiti / tabular Islamic calendar algorithm as fallback to Intl.
 */
export function getHijriParts(dateStr?: string): { day: number; monthIndex: number; year: number } {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  try {
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(validDate);
    const day = Number(parts.find(p => p.type === 'day')?.value || 1);
    const month = Number(parts.find(p => p.type === 'month')?.value || 1);
    const yearStr = parts.find(p => p.type === 'year')?.value || '1447';
    const year = Number(yearStr.replace(/[^0-9]/g, '')) || 1447;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 30) {
      return { day, monthIndex: month - 1, year };
    }
  } catch {
    // Fallback below
  }

  // Fallback arithmetic approximation
  const jd = Math.floor(validDate.getTime() / 86400000) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return {
    day: Math.max(1, Math.min(30, day)),
    monthIndex: Math.max(0, Math.min(11, month - 1)),
    year
  };
}

export function formatHijriDateIndo(dateStr?: string): string {
  const { day, monthIndex, year } = getHijriParts(dateStr);
  return `${day} ${HIJRI_MONTHS_INDO[monthIndex]} ${year} H`;
}

export function formatHijriDateArabic(dateStr?: string): string {
  const { day, monthIndex, year } = getHijriParts(dateStr);
  return `${toEasternArabicDigits(day)} ${HIJRI_MONTHS_ARABIC[monthIndex]} ${toEasternArabicDigits(year)} هـ`;
}

export function buildDefaultParentLetterNumber(
  category: ExamCategory,
  dateStr?: string,
  seq = 72
): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const romanMonth = ROMAN_MONTHS[validDate.getMonth()] || 'X';
  const masehiYear = validDate.getFullYear();
  const { year: hijriYear } = getHijriParts(dateStr);
  const numStr = String(seq).padStart(3, '0');
  const catOffset = category === 'juziyyah' ? numStr : category === 'munaqosyah' ? '073' : '074';
  return `${seq === 72 ? catOffset : numStr}/${romanMonth}/YPIA-SMPIA21/${hijriYear}.${masehiYear}`;
}

export function buildDefaultSyahadahNumber(
  category: ExamCategory,
  index: number,
  dateStr?: string
): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const romanMonth = ROMAN_MONTHS[validDate.getMonth()] || 'V';
  const year = validDate.getFullYear();
  const baseNum = category === 'juziyyah' ? 112 + index : category === 'munaqosyah' ? 201 + index : 301 + index;
  return `${String(baseNum).padStart(3, '0')}/SYH/SMPIA21/${romanMonth}/${year}`;
}

const ARABIC_JUZ_ORDINAL: Record<number, string> = {
  1: 'الأول',
  2: 'الثاني',
  3: 'الثالث',
  4: 'الرابع',
  5: 'الخامس',
  6: 'السادس',
  7: 'السابع',
  8: 'الثامن',
  9: 'التاسع',
  10: 'العاشر',
  11: 'الحادي عشر',
  12: 'الثاني عشر',
  13: 'الثالث عشر',
  14: 'الرابع عشر',
  15: 'الخامس عشر',
  16: 'السادس عشر',
  17: 'السابع عشر',
  18: 'الثامن عشر',
  19: 'التاسع عشر',
  20: 'العشرين',
  21: 'الحادي والعشرين',
  22: 'الثاني والعشرين',
  23: 'الثالث والعشرين',
  24: 'الرابع والعشرين',
  25: 'الخامس والعشرين',
  26: 'السادس والعشرين',
  27: 'السابع والعشرين',
  28: 'الثامن والعشرين',
  29: 'التاسع والعشرين',
  30: 'الثلاثين'
};

export function formatJuzForSyahadah(rawJilidOrJuz: string): {
  indoDisplay: string;
  arabicDisplay: string;
  juzNumberIndo: string;
  juzNumberArabic: string;
} {
  const cleaned = (rawJilidOrJuz || 'Juz 30')
    .replace(/\s*\(Sekali Duduk\)/gi, '')
    .trim();

  // Check if it's multi-juz like "2 Juz", "3 Juz", "5 Juz"
  const multiMatch = cleaned.match(/^(\d+)\s*Juz$/i);
  if (multiMatch) {
    const count = Number(multiMatch[1]);
    const arabDigits = toEasternArabicDigits(count);
    if (count === 2) {
      return {
        indoDisplay: '2 Juz',
        arabicDisplay: 'جزئين (٢)',
        juzNumberIndo: '2 Juz',
        juzNumberArabic: 'جزئين (٢)'
      };
    }
    if (count === 3) {
      return {
        indoDisplay: '3 Juz',
        arabicDisplay: 'ثلاثة أجزاء (٣)',
        juzNumberIndo: '3 Juz',
        juzNumberArabic: 'ثلاثة أجزاء (٣)'
      };
    }
    if (count === 5) {
      return {
        indoDisplay: '5 Juz',
        arabicDisplay: 'خمسة أجزاء (٥)',
        juzNumberIndo: '5 Juz',
        juzNumberArabic: 'خمسة أجزاء (٥)'
      };
    }
    return {
      indoDisplay: `${count} Juz`,
      arabicDisplay: `${arabDigits} أجزاء`,
      juzNumberIndo: `${count} Juz`,
      juzNumberArabic: `${arabDigits} أجزاء`
    };
  }

  // Check if it contains "Juz <number>" or is just a number like "30"
  const juzMatch = cleaned.match(/(?:Juz\s*)?(\d+)/i);
  if (juzMatch) {
    const juzNum = Number(juzMatch[1]);
    const arabNum = toEasternArabicDigits(juzNum);
    const ordinal = ARABIC_JUZ_ORDINAL[juzNum] || arabNum;
    return {
      indoDisplay: `Juz ${juzNum}`,
      arabicDisplay: `الجزء ${ordinal} (${arabNum})`,
      juzNumberIndo: String(juzNum),
      juzNumberArabic: arabNum
    };
  }

  return {
    indoDisplay: cleaned,
    arabicDisplay: cleaned,
    juzNumberIndo: cleaned,
    juzNumberArabic: cleaned
  };
}

/**
 * Logo Yayasan Al Maksum / Makarima (Left Logo in Kop Surat Undangan Orang Tua)
 */
export const MakarimaLogoEmblem: React.FC<{
  customUrl?: string;
  size?: number;
  className?: string;
}> = ({ customUrl, size = 82, className = '' }) => {
  if (customUrl && customUrl.trim() !== '') {
    return (
      <img
        src={customUrl}
        alt="Logo Yayasan Makarima"
        style={{ width: size, height: size }}
        className={`object-contain select-none shrink-0 ${className}`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <path id="makarimaTopArc" d="M 34,142 A 88,88 0 1,1 206,142" fill="none" />
        <path id="makarimaBotArc" d="M 202,150 A 86,86 0 0,1 38,150" fill="none" />
      </defs>
      {/* Outer Green Ring */}
      <circle cx="120" cy="116" r="102" fill="#FFFFFF" stroke="#008000" strokeWidth="7" />
      <circle cx="120" cy="116" r="74" fill="#FFFBEB" stroke="#008000" strokeWidth="4" />

      {/* Top Circular Text: YAYASAN AL MAKSUM */}
      <text
        fill="#006400"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontSize="14.5"
        letterSpacing="1.4"
      >
        <textPath href="#makarimaTopArc" startOffset="50%" textAnchor="middle">
          YAYASAN AL MAKSUM
        </textPath>
      </text>

      {/* Sunburst Rays */}
      <g stroke="#F59E0B" strokeWidth="3" strokeLinecap="round">
        <line x1="120" y1="54" x2="120" y2="66" />
        <line x1="92" y1="62" x2="98" y2="72" />
        <line x1="148" y1="62" x2="142" y2="72" />
        <line x1="72" y1="82" x2="82" y2="88" />
        <line x1="168" y1="82" x2="158" y2="88" />
      </g>

      {/* Rising Orange Sun */}
      <path d="M 88,118 A 32,32 0 0,1 152,118 Z" fill="#F97316" />

      {/* Green Crescent & Open Book Icon */}
      <path
        d="M 78,120 L 118,132 L 162,120 L 162,138 L 118,150 L 78,138 Z"
        fill="#15803D"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <path
        d="M 94,148 C 106,162 134,162 146,148"
        fill="none"
        stroke="#15803D"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Bottom Ribbon: MAKARIMA */}
      <rect
        x="40"
        y="188"
        width="160"
        height="28"
        rx="6"
        fill="#FFFFFF"
        stroke="#008000"
        strokeWidth="4"
      />
      <text
        x="120"
        y="207"
        textAnchor="middle"
        fill="#008000"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="2"
      >
        MAKARIMA
      </text>
    </svg>
  );
};

/**
 * Logo Sekolah Menengah Pertama Islam Al Azhar 21 (Right Logo in Kop Surat & Right Logo in Syahadah)
 */
export const AlAzhar21CircularEmblem: React.FC<{
  customUrl?: string;
  size?: number;
  className?: string;
}> = ({ customUrl, size = 82, className = '' }) => {
  const src = customUrl && customUrl.trim() !== '' ? customUrl : '/logo-alazhar21.svg';
  return (
    <img
      src={src}
      alt="Logo SMP Islam Al Azhar 21"
      style={{ width: size, height: size }}
      className={`object-contain select-none shrink-0 ${className}`}
    />
  );
};

/**
 * Logo YPI Al Azhar Blue Shield (Left Logo in Syahadah 2025 FIX.pdf)
 */
export const YpiAlAzharShieldEmblem: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 78, className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 230"
      width={size}
      height={size * 1.12}
      className={`shrink-0 select-none ${className}`}
    >
      {/* Shield Outer Frame */}
      <path
        d="M 24,16 L 176,16 L 176,118 C 176,162 100,192 100,192 C 100,192 24,162 24,118 Z"
        fill="#0082C8"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Inner White Shield Line */}
      <path
        d="M 32,24 L 168,24 L 168,115 C 168,153 100,181 100,181 C 100,181 32,153 32,115 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
      />

      {/* Left Minaret */}
      <rect
        x="54"
        y="62"
        width="20"
        height="78"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3.5"
      />
      <path
        d="M 54,62 C 54,46 64,36 64,36 C 64,36 74,46 74,62 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3.5"
      />

      {/* Main Mosque Dome */}
      <path
        d="M 88,132 C 88,80 122,68 122,68 C 122,68 156,80 156,132 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3.5"
      />
      {/* Base Step */}
      <rect
        x="48"
        y="132"
        width="112"
        height="12"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3.5"
      />

      {/* Crescent & Star */}
      <circle cx="122" cy="52" r="8" fill="#FFFFFF" />
      <circle cx="125" cy="50" r="6.5" fill="#0082C8" />

      {/* Arabic Text Below Shield: الأزهر */}
      <text
        x="100"
        y="220"
        textAnchor="middle"
        fill="#0F172A"
        fontFamily="'Traditional Arabic', 'Amiri', serif"
        fontWeight="bold"
        fontSize="28"
      >
        الأزهر
      </text>
    </svg>
  );
};

/**
 * Left Circular Emblem on Syahadah 2025 FIX_page-0001.jpg:
 * "Yayasan Karantina Tahfizh Nasional - www.sebulanhafalquran.com"
 */
export const YktnCircularEmblem: React.FC<{
  customUrl?: string;
  size?: number;
  className?: string;
}> = ({ customUrl, size = 96, className = '' }) => {
  if (customUrl && customUrl.trim() !== '') {
    return (
      <img
        src={customUrl}
        alt="Logo Yayasan Karantina Tahfizh Nasional"
        style={{ width: size, height: size }}
        className={`object-contain select-none shrink-0 ${className}`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <path id="yktnTopArc" d="M 27,120 A 93,93 0 1,1 213,120" fill="none" />
        <path id="yktnBotArc" d="M 28,124 A 92,92 0 0,0 212,124" fill="none" />
        <clipPath id="yktnInnerClip">
          <circle cx="120" cy="120" r="73" />
        </clipPath>
      </defs>

      {/* Outer Black Ring */}
      <circle cx="120" cy="120" r="112" fill="#18181B" stroke="#71717A" strokeWidth="3" />
      <circle cx="120" cy="120" r="75" fill="#FFFFFF" stroke="#52525B" strokeWidth="2.5" />

      {/* Inner Red & White Flag Background */}
      <g clipPath="url(#yktnInnerClip)">
        <rect x="40" y="40" width="160" height="82" fill="#DC2626" />
        <rect x="40" y="122" width="160" height="80" fill="#FFFFFF" />

        {/* Open Qur'an Rehal at Top Center */}
        <polygon points="120,68 92,54 88,62 120,78 152,62 148,54" fill="#FFFFFF" stroke="#18181B" strokeWidth="2.5" />
        <line x1="98" y1="84" x2="142" y2="54" stroke="#18181B" strokeWidth="5" strokeLinecap="round" />
        <line x1="142" y1="84" x2="98" y2="54" stroke="#18181B" strokeWidth="5" strokeLinecap="round" />

        {/* Silhouette of Raised Hands Supporting from Below */}
        <path
          d="M 85,166 C 84,138 98,118 112,96 L 117,100 C 110,118 106,136 108,166 Z"
          fill="#18181B"
        />
        <path
          d="M 155,166 C 156,138 142,118 128,96 L 123,100 C 130,118 134,136 132,166 Z"
          fill="#18181B"
        />
        <path d="M 78,164 Q 120,174 162,164 L 156,174 Q 120,182 84,174 Z" fill="#18181B" />

        {/* Arabic Subtitle Inside Bottom White Half */}
        <text
          x="120"
          y="186"
          textAnchor="middle"
          fill="#18181B"
          fontFamily="'Traditional Arabic', 'Amiri', serif"
          fontWeight="bold"
          fontSize="10.5"
        >
          المؤسسة الوطنية لحفظ القرآن في المخيمات
        </text>
      </g>

      {/* Stars on Left & Right of Black Ring */}
      <text x="27" y="126" textAnchor="middle" fill="#FFFFFF" fontSize="16">
        ★
      </text>
      <text x="213" y="126" textAnchor="middle" fill="#FFFFFF" fontSize="16">
        ★
      </text>

      {/* Top Ring Text: Yayasan Karantina Tahfizh Nasional */}
      <text
        fill="#FFFFFF"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        fontSize="11.5"
        letterSpacing="0.8"
      >
        <textPath href="#yktnTopArc" startOffset="50%" textAnchor="middle">
          Yayasan Karantina Tahfizh Nasional
        </textPath>
      </text>

      {/* Bottom Ring Text: www.sebulanhafalquran.com */}
      <text
        fill="#FFFFFF"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="11"
        letterSpacing="1.2"
      >
        <textPath href="#yktnBotArc" startOffset="50%" textAnchor="middle">
          www.sebulanhafalquran.com
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Right Circular Emblem on Syahadah 2025 FIX_page-0001.jpg:
 * "DIREKTORAT PENDIDIKAN - AL AZHAR SOLO BARU"
 */
export const DirektoratAlAzharSoloBaruEmblem: React.FC<{
  customUrl?: string;
  size?: number;
  className?: string;
}> = ({ customUrl, size = 96, className = '' }) => {
  if (customUrl && customUrl.trim() !== '') {
    return (
      <img
        src={customUrl}
        alt="Logo Direktorat Pendidikan Al Azhar Solo Baru"
        style={{ width: size, height: size }}
        className={`object-contain select-none shrink-0 ${className}`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <path id="dirTopArc" d="M 28,120 A 92,92 0 1,1 212,120" fill="none" />
        <path id="dirBotArc" d="M 28,126 A 92,92 0 0,0 212,126" fill="none" />
      </defs>

      {/* White Outer Circle with Black Border */}
      <circle cx="120" cy="120" r="112" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4.5" />
      {/* Blue Inner Circle */}
      <circle cx="120" cy="120" r="76" fill="#0088CC" stroke="#0F172A" strokeWidth="4" />

      {/* Top Circular Text: DIREKTORAT PENDIDIKAN */}
      <text
        fill="#0F172A"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="14.5"
        letterSpacing="1"
      >
        <textPath href="#dirTopArc" startOffset="50%" textAnchor="middle">
          DIREKTORAT PENDIDIKAN
        </textPath>
      </text>

      {/* Bottom Circular Text: AL AZHAR SOLO BARU */}
      <text
        fill="#0F172A"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="14.5"
        letterSpacing="1.2"
      >
        <textPath href="#dirBotArc" startOffset="50%" textAnchor="middle">
          AL AZHAR SOLO BARU
        </textPath>
      </text>

      {/* 8-Pointed Rub el Hizb Star Rosettes on Left & Right */}
      <g transform="translate(24, 120) scale(0.75)" stroke="#0F172A" strokeWidth="2.5" fill="none">
        <rect x="-8" y="-8" width="16" height="16" />
        <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" />
      </g>
      <g transform="translate(216, 120) scale(0.75)" stroke="#0F172A" strokeWidth="2.5" fill="none">
        <rect x="-8" y="-8" width="16" height="16" />
        <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" />
      </g>

      {/* Inside Blue Circle: Left Minaret & Right Mosque Dome */}
      <rect
        x="75"
        y="78"
        width="16"
        height="72"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3"
      />
      <path
        d="M 75,78 C 75,62 83,52 83,52 C 83,52 91,62 91,78 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3"
      />
      {/* Dome */}
      <path
        d="M 102,142 C 102,94 134,82 134,82 C 134,82 166,94 166,142 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3"
      />
      {/* Base Step */}
      <rect
        x="70"
        y="142"
        width="102"
        height="10"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3"
      />
      {/* Crescent & Star Above Dome */}
      <circle cx="134" cy="68" r="7" fill="#FFFFFF" />
      <circle cx="137" cy="66" r="5.5" fill="#0088CC" />
    </svg>
  );
};

/**
 * Full Landscape Background Waves SVG matching Syahadah 2025 FIX_page-0001.jpg
 */
export const Syahadah2025WaveBackground: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1400 990"
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
  >
    {/* Top Ice-Blue Header Backdrop */}
    <path
      d="M 0,0 L 1400,0 L 1400,340 Q 1160,360 950,260 Q 700,145 450,260 Q 240,360 0,340 Z"
      fill="#EAF3FA"
    />

    {/* LEFT RIBBON WAVES */}
    {/* Left Light Blue Lower Wave */}
    <path
      d="M 0,220 Q 190,265 445,260 Q 245,355 0,342 Z"
      fill="#9AC7EC"
    />
    {/* Left Grey Middle Wave */}
    <path
      d="M 0,172 Q 195,235 445,260 Q 210,275 0,235 Z"
      fill="#9E9E9E"
    />
    {/* Left Deep Blue Upper Ribbon */}
    <path
      d="M 0,122 Q 215,180 445,260 Q 215,230 0,168 Z"
      fill="#1982C4"
    />

    {/* RIGHT RIBBON WAVES (Symmetrical) */}
    {/* Right Light Blue Lower Wave */}
    <path
      d="M 1400,220 Q 1210,265 955,260 Q 1155,355 1400,342 Z"
      fill="#9AC7EC"
    />
    {/* Right Grey Middle Wave */}
    <path
      d="M 1400,172 Q 1205,235 955,260 Q 1190,275 1400,235 Z"
      fill="#9E9E9E"
    />
    {/* Right Deep Blue Upper Ribbon */}
    <path
      d="M 1400,122 Q 1185,180 955,260 Q 1185,230 1400,168 Z"
      fill="#1982C4"
    />

    {/* Bottom Center Blue Curved Wave Footer */}
    <path
      d="M 0,990 Q 700,942 1400,990 L 1400,990 L 0,990 Z"
      fill="#1982C4"
    />
  </svg>
);

/**
 * Handwritten Signature SVG for Mudir YKTN (Ma'mun Al Qurthubi Al Hafizh)
 */
export const MudirYktnSignatureSvg: React.FC<{ className?: string }> = ({
  className = 'h-16 mx-auto'
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 220 95"
    className={`select-none pointer-events-none ${className}`}
  >
    <path
      d="M 65,86 C 92,62 128,16 142,10 C 148,8 148,16 138,28 C 122,48 96,74 96,80 C 96,84 108,72 116,66 C 118,64 116,78 122,78 C 128,78 134,70 138,72 C 140,74 138,80 146,78"
      fill="none"
      stroke="#18181B"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Handwritten Signature SVG for Direktur Al Azhar Solo Baru (Kartika Dewi A. R., M. Psi., Psikolog)
 */
export const DirekturAlAzharSignatureSvg: React.FC<{ className?: string }> = ({
  className = 'h-16 mx-auto'
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 340 95"
    className={`select-none pointer-events-none ${className}`}
  >
    <path
      d="M 38,76 C 18,76 22,52 54,42 C 74,36 86,38 86,38 M 74,18 L 74,74 M 54,54 C 72,48 92,42 104,52 C 110,56 116,44 124,48 C 132,52 136,16 136,16 L 134,84 M 136,46 C 146,36 162,38 158,48 C 154,56 172,42 184,44 C 194,46 176,62 192,62 C 218,62 272,46 318,36"
      fill="none"
      stroke="#3F3F46"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

