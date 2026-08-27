import { IqroJilid, MatrikulasiDay, IqroSyllabusItem, MatrikulasiStudent, MatrikulasiRecord } from '../types';

export const IQRO_JILIDS: IqroJilid[] = [
  'Iqro 1',
  'Iqro 2',
  'Iqro 3',
  'Iqro 4',
  'Iqro 5',
  'Iqro 6'
];

export const MATRIKULASI_DAYS: MatrikulasiDay[] = ['Selasa', 'Rabu', 'Kamis'];

export const IQRO_SYLLABUS: IqroSyllabusItem[] = [
  {
    jilid: 'Iqro 1',
    title: 'Buku Iqro 1: Pengenalan Huruf Hijaiyyah Tunggal Berharakat Fathah (A s/d Ya)',
    totalPages: 32,
    description: 'Pengenalan bunyi 28 huruf hijaiyyah terpisah berharakat fathah. Menekankan artikulasi makhraj huruf yang murni, tegas, pendek 1 ketukan, tanpa mengeja.',
    keyTopics: [
      'Huruf Tunggal Hijaiyyah Alif sampai Dzal',
      'Huruf Tunggal Ro sampai Qof',
      'Huruf Tunggal Kaf sampai Ya',
      'Latihan Perbandingan Huruf Serupa (Ba-Ta-Tsa, Ja-Ha-Kho, Da-Dza, Sa-Sya, Shod-Dhod, Tho-Zho, \'Ain-Ghoin)',
      'Evaluasi Kenaikan Iqro Jilid 2'
    ],
    guidanceTips: [
      'Ajarkan secara langsung bunyi huruf tanpa mengeja (A, Ba, Ta...).',
      'Pastikan bacaan santri tetap pendek (1 ketukan murni), tidak boleh dipanjangkan atau diayunkan.',
      'Fokus pada ketepatan makhraj huruf yang sering tertukar.'
    ],
    arabicExample: 'اَ  بَ  تَ  ثَ  -  جَ  حَ  خَ  -  دَ  ذَ  -  رَ  زَ  -  سَ  شَ  -  صَ  ضَ'
  },
  {
    jilid: 'Iqro 2',
    title: 'Buku Iqro 2: Pengenalan Huruf Bersambung & Bacaan Panjang (Mad Thabi\'i 2 Harakat)',
    totalPages: 32,
    description: 'Pengenalan bentuk huruf bersambung di awal, tengah, dan akhir kata. Mengenalkan konsep bacaan panjang (Mad Thabi\'i) 2 harakat dengan huruf Alif dan Fathah Berdiri.',
    keyTopics: [
      'Bentuk Huruf Bersambung 2 & 3 Huruf',
      'Mad Thabi\'i Fathah diikuti Alif (Panjang 2 Harakat / 1 Ayunan)',
      'Fathah Berdiri / Tegak (Mad Asli 2 Harakat)',
      'Latihan Kontras Bacaan Pendek vs Bacaan Panjang',
      'Evaluasi Kenaikan Iqro Jilid 3'
    ],
    guidanceTips: [
      'Jelaskan perubahan bentuk kepala huruf ketika disambung di awal, tengah, dan akhir.',
      'Latih konsistensi ketukan mad: 2 harakat murni tidak boleh berlebih atau kurang.',
      'Santri harus spontan membedakan kata pendek (kata-ba) dan panjang (kaa-ta-ba).'
    ],
    arabicExample: 'بَتَ  -  ثَبَتَ  -  بَا  تَا  -  كَتَبَ  ⬅  كَاتَبَ  -  هٰذَا  ذٰلِكَ'
  },
  {
    jilid: 'Iqro 3',
    title: 'Buku Iqro 3: Pengenalan Harakat Kasrah (I), Dhammah (U), & Mad Thabi\'i Ya/Wawu Sukun',
    totalPages: 32,
    description: 'Pengenalan variasi harakat lengkap (Fathah, Kasrah, Dhammah) serta pemanjangan Mad Thabi\'i dengan Ya Sukun dan Wawu Sukun, serta Kasrah Berdiri dan Dhammah Terbalik.',
    keyTopics: [
      'Harakat Kasrah (Bunyi I Murni) & Dhammah (Bunyi U Murni)',
      'Kombinasi 3 Harakat A-I-U dalam 1 Kata (Khuliqo, Kutiba, \'Amila)',
      'Mad Thabi\'i Kasrah + Ya Sukun (Bii, Tii, Jii) 2 Harakat',
      'Mad Thabi\'i Dhammah + Wawu Sukun (Buu, Tuu, Juu) 2 Harakat',
      'Kasrah Berdiri & Dhammah Terbalik (Mad Badal/Shilah)',
      'Evaluasi Kenaikan Iqro Jilid 4'
    ],
    guidanceTips: [
      'Tekankan pelafalan Kasrah agar meringis (tidak seperti E) dan Dhammah agar monyong bulat (tidak seperti O).',
      'Bimbing ketukan mad saat berpindah harakat A-I-U secara lincah.',
      'Gunakan gerakan tangan 1 ayunan untuk menjaga durasi 2 harakat.'
    ],
    arabicExample: 'كُتِبَ  -  خُلِقَ  -  عَمِلَ  -  دِيْنِ  -  يَقُوْلُ  -  فِيْهَا  -  بِهٖ  -  لَهٗ'
  },
  {
    jilid: 'Iqro 4',
    title: 'Buku Iqro 4: Tanwin (-An, -In, -Un), Huruf Sukun Mati, & Kaidah Pantulan Qalqalah',
    totalPages: 32,
    description: 'Penguasaan bunyi Tanwin (Fathatain, Kasratain, Dhammatain), pengucapan huruf sukun mati tanpa desis memantul, serta kaidah pantulan Qalqalah pada huruf Baju Di Toko.',
    keyTopics: [
      'Tanwin: Fathatain (-an), Kasratain (-in), Dhammatain (-un)',
      'Huruf Sukun Mati Non-Qalqalah (Hams & Rakhawah)',
      'Kaidah Qalqalah Sughra pada Huruf ب ج د ط ق (Baju Di Toko)',
      'Perbedaan Huruf Sukun Alir Nafas vs Pantul Bening',
      'Angka Arab 1-100 untuk Navigasi Mushaf',
      'Evaluasi Kenaikan Iqro Jilid 5'
    ],
    guidanceTips: [
      'Tanwin dibaca cepat 1 ketukan berbunyi nun mati.',
      'Huruf sukun non-qalqalah tidak boleh sengaja dipantulkan (jangan berbunyi "tak-e").',
      'Huruf qalqalah saat sukun harus memantul ringan dan jernih tanpa hamzah tambahan.'
    ],
    arabicExample: 'كِتَابًا  -  رَحْمَةٍ  -  عَلِيْمٌ  |  يَأْكُلُ  -  نَعْبُدُ  |  اَبْ  -  اَجْ  -  اَدْ  -  اَطْ  -  اَقْ'
  },
  {
    jilid: 'Iqro 5',
    title: 'Buku Iqro 5: Tanda Tasydid, Ghunnah Musyaddadah, Alif Lam, & Kaidah Waqaf',
    totalPages: 32,
    description: 'Pengenalan penekanan tanda Tasydid (Syaddah), hukum dengung Ghunnah Musyaddadah pada Nun/Mim bertasydid (2-3 ketukan), Alif Lam Qamariyah/Syamsiyah, serta kaidah waqaf berhenti di akhir kalimat.',
    keyTopics: [
      'Tanda Tasydid / Syaddah Umum (Tekanan Suara 2 Huruf)',
      'Ghunnah Musyaddadah (Nun & Mim Tasydid Ditahan Dengung 2-3 Ketukan)',
      'Alif Lam Qamariyah (Jelas) & Alif Lam Syamsiyah (Melebur)',
      'Kaidah Waqaf: Mematikan Huruf Akhir & Ta Marbuthah menjadi Ha Sukun',
      'Kaidah Mad \'Iwadh (Fathatain di Akhir Waqaf Menjadi Mad 2 Harakat)',
      'Evaluasi Kenaikan Iqro Jilid 6'
    ],
    guidanceTips: [
      'Tahan dengung nun & mim tasydid di rongga hidung selama 2-3 ketukan sebelum melepas ke harakat berikutnya.',
      'Latih santri berhenti di akhir ayat secara tenang dan mematikan huruf terakhir dengan benar.'
    ],
    arabicExample: 'رَبَّ  -  كُلَّ  |  اِنَّ  -  ثُمَّ  -  عَمَّ  |  الْحَمْدُ  -  الشَّمْسُ  |  الْعَالَمِيْنَ ⬅ الْعَالَمِيْنْ'
  },
  {
    jilid: 'Iqro 6',
    title: 'Buku Iqro 6: Hukum Tajwid Lanjutan (Nun Sukun, Mim Sukun, Mad Pedang) & Pra Al-Qur\'an',
    totalPages: 32,
    description: 'Penerapan hukum tajwid aplikatif lengkap: Idzhar, Idgham Bighunnah/Bilaghunnah, Iqlab, Ikhfa Haqiqi, Hukum Mim Sukun, Lafadz Allah, Mad Wajib/Jaiz 4-5 Harakat, Mad Lazim 6 Harakat, serta Munaqasyah Khatam Iqro menuju Al-Qur\'an.',
    keyTopics: [
      'Hukum Nun Sukun/Tanwin: Idzhar, Idgham Bighunnah, Idgham Bilaghunnah, Iqlab, Ikhfa (15 Huruf)',
      'Hukum Mim Sukun: Idzhar Syafawi, Ikhfa Syafawi, Idgham Mimi',
      'Lafadz Allah (Tafkhim Tebal & Tarqiq Tipis)',
      'Mad Wajib Muttashil, Mad Jaiz Munfashil (4-5 Harakat), Mad Lazim (6 Harakat)',
      'Tanda-Tanda Waqaf Rasm Utsmani (Mim, Tho, Jim, Zay, Shod, Qof-Lam, Lam-Alif)',
      'Munaqasyah Khatam Iqro (Ujian Kelulusan Matrikulasi Menuju Tilawah Al-Qur\'an)'
    ],
    guidanceTips: [
      'Pastikan santri mengenali hukum secara spontan saat melihat ayat, bukan sekadar teori hafalan.',
      'Latih nafas dan intonasi tartil sebelum santri dinyatakan lulus matrikulasi dan naik ke mushaf Al-Qur\'an.'
    ],
    arabicExample: 'مَنْ اٰمَنَ  -  مَنْ يَّقُوْلُ  -  مِنْ رَّبِّهِمْ  -  مِمْبَعْدِ  -  مِنْ قَبْلِ  -  جَآءَ  -  وَلَا الضَّآلِّيْنَ'
  }
];

// Data awal santri peserta bimbingan matrikulasi (khusus santri kelas 8 & 9)
export const INITIAL_MATRIKULASI_STUDENTS: MatrikulasiStudent[] = [
  {
    id: 'mat-std-1',
    studentId: 'std-8', // Khalid Ibnu Walid (Kelas 8A)
    enrolledDate: '2026-08-01',
    status: 'Aktif',
    currentIqroJilid: 'Iqro 4',
    currentIqroPage: 18,
    assignedTeacherId: 't-3',
    scheduleDays: ['Selasa', 'Rabu', 'Kamis'],
    initialReason: 'Pemantapan kaidah sukun, makhraj huruf hams, dan pantulan qalqalah.',
    notes: 'Perkembangan signifikan, artikulasi huruf hams dan qalqalah semakin stabil.'
  },
  {
    id: 'mat-std-2',
    studentId: 'std-12', // Dzaki Malik Al-Qudus (Kelas 8A)
    enrolledDate: '2026-08-05',
    status: 'Aktif',
    currentIqroJilid: 'Iqro 5',
    currentIqroPage: 12,
    assignedTeacherId: 't-3',
    scheduleDays: ['Selasa', 'Rabu', 'Kamis'],
    initialReason: 'Penguatan ketukan ghunnah musyaddadah dan kaidah waqaf akhir ayat.',
    notes: 'Sudah mulai terbiasa menahan dengung 2-3 ketukan pada nun dan mim bertasydid.'
  },
  {
    id: 'mat-std-3',
    studentId: 'std-9', // Maryam Khairunnisa (Kelas 8B / 7-8)
    enrolledDate: '2026-08-10',
    status: 'Aktif',
    currentIqroJilid: 'Iqro 3',
    currentIqroPage: 24,
    assignedTeacherId: 't-2',
    scheduleDays: ['Selasa', 'Rabu', 'Kamis'],
    initialReason: 'Perbaikan kestabilan harakat Kasrah-Dhammah dan mad thabi\'i ya/wawu sukun.',
    notes: 'Diberikan bimbingan khusus pada pemanjangan mad 2 harakat yang konsisten.'
  }
];

// Sesi mutaba'ah catatan bimbingan matrikulasi Iqro (Selasa, Rabu, Kamis)
export const INITIAL_MATRIKULASI_RECORDS: MatrikulasiRecord[] = [
  {
    id: 'mat-rec-1',
    matrikulasiStudentId: 'mat-std-1',
    studentId: 'std-8',
    teacherId: 't-3',
    date: '2026-08-25', // Selasa
    day: 'Selasa',
    jilid: 'Iqro 4',
    page: 18,
    materialFocus: 'Kaidah Pantulan Qalqalah Sughra (Ba, Jim, Dal, Tha, Qaf)',
    score: 88,
    status: 'Lulus',
    notes: 'Pantulan qalqalah sudah bersih dan tidak ada penambahan hamzah di akhir pantulan. Lulus halaman 18.'
  },
  {
    id: 'mat-rec-2',
    matrikulasiStudentId: 'mat-std-2',
    studentId: 'std-12',
    teacherId: 't-3',
    date: '2026-08-25', // Selasa
    day: 'Selasa',
    jilid: 'Iqro 5',
    page: 12,
    materialFocus: 'Ghunnah Musyaddadah Nun dan Mim Bertasydid',
    score: 84,
    status: 'Lulus',
    notes: 'Dengung ghunnah sudah ditahan 2-3 ketukan. Lulus lanjut ke halaman 13.'
  },
  {
    id: 'mat-rec-3',
    matrikulasiStudentId: 'mat-std-3',
    studentId: 'std-9',
    teacherId: 't-2',
    date: '2026-08-26', // Rabu
    day: 'Rabu',
    jilid: 'Iqro 3',
    page: 24,
    materialFocus: 'Mad Thabi\'i Ya Sukun & Wawu Sukun (2 Harakat)',
    score: 72,
    status: 'Ulang',
    notes: 'Pemanjangan mad 2 harakat belum stabil pada wawu sukun. Perlu diulang kembali halaman 24 untuk pemantapan.'
  }
];
