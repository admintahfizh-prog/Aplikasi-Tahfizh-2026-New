# Rencana Implementasi: Grafik Ketercapaian Target, Format Raport Kelas 8-9 (Sesuai PDF), & Leger Raport Kelas

Fitur komprehensif untuk menyajikan visualisasi data ketercapaian target santri di Dashboard Utama, memfasilitasi 2 pilihan format raport (Format Kelas 7 dan Format PDF Kelas 8 & 9 berstandar Ibadah Harian), serta menyediakan Leger Raport Kelas terpadu yang dapat dicetak dan diekspor ke Excel.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Terkonfirmasi dari Tanya Jawab (Phase 1):**
> 1. **Penempatan Grafik Ketercapaian**: Ditampilkan langsung di **Dashboard Utama** agar pimpinan, koordinator, dan ustadz/ustadzah langsung melihat ringkasan visual performa per jenjang (7, 8, 9) dan per kelas.
> 2. **Leger Raport Kelas**: Menyajikan tabel lengkap berisi NIS/NISN, Nama Santri, Halaqah, Capaian Hafalan, Target, Status Ketuntasan (% & Tuntas/Belum Tuntas), Rekapitulasi Absensi (H/S/I/A), Catatan/Poin Pelanggaran, serta Nilai Ibadah/Predikat dengan opsi Ekspor Excel dan Cetak F4.
> 3. **Dua Pilihan Format Raport**: Menyediakan *toggle / selector* format di tampilan Raport Santri (`StudentRaportCard`):
>    - **Format A (Kelas 7 / Reguler Ummi)**: Memuat Capaian Tahfizh + Perkembangan Individu Metode Ummi + Kedisiplinan + Catatan (TTD: Kepala Sekolah & Koordinator Tahfizh).
>    - **Format B (Kelas 8 & 9 / Contoh PDF Resmi)**: Berjudul *"Laporan Program Tahfizhul Qur'an dan Ibadah Harian Tengah Semester"*, memuat Ketercapaian Tahfizh (Surat/Ayat, Target, Keterangan Tuntas), Kedisiplinan, Praktik Ibadah (Gerakan Shalat, Dzikir Setelah Shalat, Doa Harian), Catatan, serta TTD Kepala Sekolah & **Wali Kelas**. Otomatis terpilih secara cerdas untuk santri kelas 8 & 9 namun tetap dapat dialihkan manual kapan saja.

---

## 1. Overview & Core Concept

Fitur ini menjawab kebutuhan pelaporan akademik dan monitoring kepesantrenan di SMP Islam Al Azhar 21:
- **Grafik Ketercapaian Multi-Dimensi di Dashboard**: Memberikan *high-level executive overview* persentase santri yang tuntas target hafalan dan Ummi, dapat difilter per jenjang (Semua, Kelas 7, Kelas 8, Kelas 9) maupun spesifik per kelas (7A s.d. 9E).
- **Format Raport Khusus Kelas 8 & 9 (Sesuai PDF Terlampir)**: Mengadopsi format resmi terbaru yang menekankan ibadah harian santri (bacaan shalat, dzikir, doa harian) serta kedisiplinan dan capaian tahfizh tanpa komponen Ummi, dilengkapi TTD Wali Kelas dan Kepala Sekolah.
- **Leger Raport Kelas Terpadu**: Satu lembar rekapitulasi data sekelas yang memudahkan rapat pleno kenaikan/evaluasi tengah semester, dapat diekspor langsung ke spreadsheet Excel (.xlsx) atau dicetak format F4.

---

## 2. User Experience & Visual Design

### A. Grafik Ketercapaian Target di Dashboard Utama
- **Penempatan**: Berada tepat di bawah kartu statistik ringkasan dan di atas tabel mutaba'ah harian.
- **Filter Interaktif**:
  - Pilihan Jenjang: `Semua Jenjang` · `Kelas 7` · `Kelas 8` · `Kelas 9`
  - Dropdown Kelas Dinamis: Menyesuaikan kelas yang tersedia berdasarkan jenjang yang dipilih (misal jika memilih Kelas 8: `8A`, `8B`, `8C`, `8D`, `8E`).
  - Toggle Metrik: `Kombinasi (Tahfizh & Ummi)` · `Fokus Tahfizh` · `Fokus Ummi`.
- **Visualisasi Chart**:
  - Bar Chart horizontal/vertikal interaktif (Recharts) menampilkan jumlah santri Tuntas vs Belum Tuntas.
  - Kartu Metrik Persentase Ketuntasan (misal: *87.5% Santri Kelas 8 Tuntas Target*).
  - Distribusi per kelas untuk membandingkan performa antar halaqah/kelas secara adil.

### B. Dua Pilihan Format Raport Santri (`StudentRaportCard`)
- **Header Switcher**: Tombol pengalih format di panel atas kontrol raport:
  - Tombol 1: `Format 1: Kelas 7 (Tahfizh & Ummi)`
  - Tombol 2: `Format 2: Kelas 8-9 (Tahfizh & Ibadah Harian - PDF)`
- **Sistem Auto-Detect**: Santri kelas 8 dan 9 secara cerdas langsung mengaktifkan Format 2, sementara kelas 7 mengaktifkan Format 1. Pengguna tetap bebas mengganti format sewaktu-waktu.
- **Detail Desain Format 2 (Persis PDF)**:
  1. *Kop*: Logo Al Azhar (kiri), Kaligrafi Basmalah (tengah), Logo Yayasan Makarima (kanan).
  2. *Judul*: `LAPORAN PROGRAM TAHFIZHUL QUR'AN DAN IBADAH HARIAN` - `SMP ISLAM AL AZHAR 21 SUKOHARJO` - `TENGAH SEMESTER 1` - `Tahun Ajaran 2026/2027`.
  3. *Identitas*: Nama, No. Induk / NISN, Kelas, Halaqah Tahfizh.
  4. *Romawi I (Ketercapaian Tahfizh)*: Tabel Surat/Ayat Capaian, Target, Keterangan (TUNTAS / BELUM TUNTAS).
  5. *Romawi II (Kedisiplinan)*: Ketidakhadiran (A, I, S) dan Pelanggaran.
  6. *Romawi III (Ibadah)*: Tabel Praktik Ibadah (1. Gerakan dan Bacaan Shalat, 2. Bacaan Dzikir dan Do'a Setelah Shalat, 3. Do'a-do'a Harian) dengan nilai Angka dan Huruf (dapat diedit langsung atau terisi otomatis).
  7. *Romawi IV (Catatan)*: Catatan apresiasi/motivasi musyrif/wali kelas.
  8. *Tanda Tangan*: Kepala SMP Islam Al Azhar 21 Sukoharjo (kiri) & Wali Kelas (kanan).
  9. *Ukuran Lembar*: Strict Folio / F4 (215mm x 330mm) satu halaman penuh.

### C. Leger Raport Kelas Terpadu di Menu Laporan (`ReportsView`)
- **Navigasi Tab Baru**: Menambahkan tombol `Leger Raport Kelas` berdampingan dengan `Raport Santri`, `Rekap Nilai`, dan `Rekap Bulanan`.
- **Filter Leger**: Pemilih Kelas (7A–9E), Semester/Term, dan Pencarian Santri.
- **Struktur Kolom Tabel Leger**:
  - `No` · `NIS` · `NISN` · `Nama Santri` · `Kelas` · `Halaqah`
  - `Capaian Tahfizh` (Surat & Ayat) · `Target Tahfizh` · `% Ketercapaian` · `Status (Tuntas / Belum Tuntas)`
  - `Capaian Ummi` (Jilid & Halaman) · `Nilai Ummi`
  - `Presensi` (Hadir, Sakit, Izin, Alpa)
  - `Pelanggaran` (Jumlah Poin & Catatan)
  - `Praktik Ibadah` (Rata-rata Nilai Shalat & Dzikir)
  - `Aksi`: Tombol langsung untuk membuka Raport Individu santri tersebut.
- **Fitur Ekspor & Cetak**:
  - Tombol `Download Excel Leger (.xlsx)`: Mengunduh file Excel lengkap berformat tabel rapi.
  - Tombol `Cetak Leger (F4)`: Layout cetak landscape F4 rapi tanpa terpotong.

---

## 3. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DashboardView.tsx                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ TargetAchievementAnalyticsCard (New Component)                   │  │
│  │ - Jenjang Filter: All | Kelas 7 | Kelas 8 | Kelas 9              │  │
│  │ - Class Filter: Dynamic (7A-7E, 8A-8E, 9A-9E)                   │  │
│  │ - Recharts: BarChart (Tuntas vs Belum) & Progress Indicators     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ReportsView.tsx                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ LegerRaportKelasSection (New Sub-view / Tab)                     │  │
│  │ - Filter: Jenjang, Kelas, Term/Semester                          │  │
│  │ - High-Density Table (NIS, Nama, Capaian, Target, Absen, SP)    │  │
│  │ - Handlers: Export XLSX (xlsx lib) & Print Isolated F4 Landscape │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     StudentRaportCard.tsx                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Template Mode Switcher:                                          │  │
│  │ [ Format 1: Kelas 7 (Tahfizh+Ummi) ] [ Format 2: Kelas 8-9 (PDF) ]│  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Template 2 (Kelas 8-9 Ibadah Harian):                            │  │
│  │ - I. Ketercapaian Tahfizh (Surat/Ayat, Target, TUNTAS)           │  │
│  │ - II. Kedisiplinan (Ketidakhadiran A/I/S & Pelanggaran)          │  │
│  │ - III. Praktik Ibadah (Shalat, Dzikir, Doa Harian)               │  │
│  │ - IV. Catatan Santri                                             │  │
│  │ - TTD: Kepala Sekolah & Wali Kelas (Bukan Koordinator)           │  │
│  │ - Print & PDF Export: Strict F4 (215mm x 330mm, single page)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Rencana Tahapan Eksekusi

1. **Dashboard Analytics Component**:
   - Membangun modul analitik ketercapaian target hafalan dan Ummi di `src/components/DashboardView.tsx`.
   - Menghitung agregasi persentase ketuntasan santri per jenjang (7, 8, 9) dan per kelas.
   - Merender grafik batang Recharts dan kartu persentase tuntas dengan filter interaktif.

2. **Dua Format Raport di `StudentRaportCard.tsx`**:
   - Menambahkan state `raportTemplateMode: 'kelas7' | 'kelas8_9'`.
   - Mengatur deteksi otomatis berdasarkan jenjang santri (`isGrade8or9Student(student)`).
   - Mengimplementasikan tata letak Format 2 sesuai contoh PDF:
     - Judul: Laporan Program Tahfizhul Qur'an dan Ibadah Harian Tengah Semester.
     - Bagian I: Capaian Tahfizhul Qur'an (Surat/Ayat, Target, Keterangan TUNTAS).
     - Bagian II: Kedisiplinan (A, I, S dan Catatan Pelanggaran).
     - Bagian III: Praktik Ibadah (Gerakan & Bacaan Shalat, Dzikir & Doa Setelah Shalat, Doa-doa Harian).
     - Bagian IV: Catatan.
     - Tanda Tangan: Kepala SMP Islam Al Azhar 21 Sukoharjo dan Wali Kelas (dengan input/upload tanda tangan wali kelas & kepala sekolah).
   - Menjamin cetak dan download PDF kedua format tetap presisi di kertas F4 / Folio (215mm x 330mm) 1 lembar.

3. **Leger Raport Kelas Terpadu di `ReportsView.tsx`**:
   - Menambahkan tab `leger_raport` pada bilah navigasi laporan.
   - Membangun tabel leger komprehensif berkecepatan tinggi dengan data real-time: Identitas, Capaian Tahfizh, Target, Status Tuntas, Capaian Ummi, Absensi, Pelanggaran, Nilai Ibadah, dan Catatan.
   - Menambahkan handler ekspor XLSX (`handleExportLegerExcel`) dan tombol cetak F4 Landscape (`handlePrintLeger`).

4. **Verifikasi & Validasi**:
   - Menjalankan `lint_applet` dan `compile_applet` untuk memastikan bebas kesalahan sintaks dan tipe TypeScript.
   - Menguji responsivitas di desktop dan tablet.
