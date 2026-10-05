import { Student, ClassItem } from '../types';
import {
  buildStudentAttendanceQrPayload,
  buildStudentQrCodeBadgeId,
  getCachedStudentQrDataUrl
} from '../components/QrAttendancePanel';

/**
 * Matches a raw scanned QR Code or 1D Barcode string against the list of students.
 */
export function findStudentByScannedCode(
  rawCode: string,
  students: Student[]
): Student | undefined {
  const raw = (rawCode || '').trim();
  if (!raw) return undefined;

  // 1. Check ALAZHAR21-ATT|studentId|nis|name format
  if (raw.startsWith('ALAZHAR21-ATT|')) {
    const parts = raw.split('|');
    const scannedId = parts[1]?.trim();
    const scannedNis = parts[2]?.trim();
    const found = students.find(
      s => s.id === scannedId || (scannedNis && s.nis === scannedNis)
    );
    if (found) return found;
  }

  // 2. Check QR-AA21-... badge format, NIS, NISN, ID, or exact Name
  const normalized = raw.toLowerCase();
  const cleanDigits = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return students.find(s => {
    const badge = buildStudentQrCodeBadgeId(s).toLowerCase();
    const badgeClean = badge.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const payload = buildStudentAttendanceQrPayload(s).toLowerCase();
    const nis = (s.nis || '').toLowerCase();
    const nisn = (s.nisn || '').toLowerCase();
    return (
      badge === normalized ||
      badgeClean === cleanDigits ||
      payload === normalized ||
      s.id.toLowerCase() === normalized ||
      (nis && (nis === normalized || nis === cleanDigits)) ||
      (nisn && (nisn === normalized || nisn === cleanDigits)) ||
      s.name.toLowerCase() === normalized
    );
  });
}

/**
 * Generates deterministic 1D barcode SVG bars from a code string (e.g., QR-AA21-2607001)
 */
export function buildBarcodeSvgDataUrl(codeText: string): string {
  const text = (codeText || 'AA21').toUpperCase();
  const bars: number[] = [2, 1, 1, 2, 1, 2]; // Start guard
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bars.push(((code >> 4) & 3) + 1);
    bars.push(((code >> 2) & 2) + 1);
    bars.push((code & 3) + 1);
    bars.push(((code >> 1) & 2) + 1);
  }
  bars.push(2, 1, 2, 1, 1, 2); // Stop guard

  let totalUnits = 0;
  bars.forEach(w => {
    totalUnits += w;
  });

  const width = Math.max(180, totalUnits * 2);
  const height = 36;
  let x = 0;
  let rects = '';

  for (let i = 0; i < bars.length; i++) {
    const w = bars[i] * 2;
    if (i % 2 === 0) {
      rects += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#0F172A" />`;
    }
    x += w;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="none">${rects}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Plays a short confirmation beep using Web Audio API when a scan succeeds.
 */
export function playScanSuccessBeep(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Ignore audio context errors
  }
}

/**
 * Prints 1 or multiple student QR & Barcode ID cards cleanly using a hidden print iframe.
 */
export async function printStudentQrCards(
  studentsToPrint: Student[],
  classes: ClassItem[],
  existingQrUrls: Record<string, string> = {},
  layoutMode: 'grid_8' | 'grid_4' | 'single' = 'grid_8'
): Promise<void> {
  if (!studentsToPrint || studentsToPrint.length === 0) return;

  // Ensure all QR data URLs are ready
  const qrMap: Record<string, string> = { ...existingQrUrls };
  for (const std of studentsToPrint) {
    if (!qrMap[std.id]) {
      qrMap[std.id] = await getCachedStudentQrDataUrl(std);
    }
  }

  const cardsHtml = studentsToPrint
    .map(std => {
      const clsName = classes.find(c => c.id === std.classId)?.name || '7A';
      const badgeId = buildStudentQrCodeBadgeId(std);
      const qrUrl = qrMap[std.id] || '';
      const barcodeUrl = buildBarcodeSvgDataUrl(badgeId);
      const program = std.program || 'Reguler';

      return `
        <div class="qr-card">
          <div class="qr-card-header">
            <div class="qr-card-subtitle">KARTU PRESENSI, HAFALAN &amp; UMMI</div>
            <div class="qr-card-school">SMP ISLAM AL AZHAR 21 SOLO BARU</div>
          </div>
          <div class="qr-card-goldline"></div>
          <div class="qr-card-body">
            <div class="qr-box">
              ${qrUrl ? `<img src="${qrUrl}" alt="QR ${std.name}" class="qr-img" />` : ''}
            </div>
            <div class="student-name">${std.name}</div>
            <div class="student-meta">NIS: <strong>${std.nis || '-'}</strong> &bull; Kelas: <strong>${clsName}</strong> &bull; ${program}</div>
            <div class="barcode-box">
              <img src="${barcodeUrl}" alt="Barcode ${badgeId}" class="barcode-img" />
              <div class="badge-code">${badgeId}</div>
            </div>
            <div class="qr-card-footer">Scan QR / Barcode untuk Absen, Setoran Hafalan &amp; Ummi</div>
          </div>
        </div>
      `;
    })
    .join('');

  const columnsCss =
    layoutMode === 'single'
      ? 'grid-template-columns: 320px; justify-content: center;'
      : layoutMode === 'grid_4'
      ? 'grid-template-columns: repeat(2, 1fr);'
      : 'grid-template-columns: repeat(2, 1fr);';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Cetak Kartu QR & Barcode Santri - SMPI Al Azhar 21</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
          }
          .sheet-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid #1E293B;
          }
          .sheet-header h1 {
            font-size: 13px;
            margin: 0;
            color: #1E293B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .sheet-header p {
            font-size: 10px;
            margin: 2px 0 0;
            color: #64748b;
          }
          .cards-grid {
            display: grid;
            ${columnsCss}
            gap: 10px;
          }
          .qr-card {
            border: 1.5px dashed #94a3b8;
            border-radius: 10px;
            overflow: hidden;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .qr-card-header {
            background: #1E293B;
            color: #ffffff;
            text-align: center;
            padding: 7px 8px;
          }
          .qr-card-subtitle {
            font-size: 8.5px;
            font-weight: 800;
            color: #D4AF37;
            letter-spacing: 0.8px;
          }
          .qr-card-school {
            font-size: 10.5px;
            font-weight: 900;
            margin-top: 1px;
          }
          .qr-card-goldline {
            height: 3px;
            background: #D4AF37;
          }
          .qr-card-body {
            padding: 10px 12px;
            text-align: center;
          }
          .qr-box {
            width: ${layoutMode === 'grid_4' || layoutMode === 'single' ? '145px' : '112px'};
            height: ${layoutMode === 'grid_4' || layoutMode === 'single' ? '145px' : '112px'};
            margin: 0 auto 6px;
            padding: 5px;
            border: 1.5px solid #D4AF37;
            border-radius: 8px;
            background: #ffffff;
          }
          .qr-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
          .student-name {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .student-meta {
            font-size: 9.5px;
            color: #475569;
            margin-bottom: 6px;
          }
          .barcode-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 4px 8px 3px;
            max-width: 210px;
            margin: 0 auto 5px;
          }
          .barcode-img {
            height: 20px;
            width: 100%;
            display: block;
          }
          .badge-code {
            font-family: monospace;
            font-size: 10px;
            font-weight: 900;
            color: #8C7015;
            margin-top: 2px;
            letter-spacing: 0.5px;
          }
          .qr-card-footer {
            font-size: 8px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="sheet-header">
          <h1>Kartu QR &amp; Barcode Presensi, Setoran Hafalan &amp; Metode Ummi — SMP Islam Al Azhar 21 Solo Baru</h1>
          <p>Dicetak otomatis (${studentsToPrint.length} Kartu Santri) • Gunting mengikuti garis putus-putus</p>
        </div>
        <div class="cards-grid">
          ${cardsHtml}
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 3000);
  }, 350);
}
