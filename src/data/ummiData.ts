import { LearningMaterial } from '../types';

export const UMMI_JILIDS = [
  'Jilid 1',
  'Jilid 2',
  'Jilid 3',
  'Jilid 4',
  'Jilid 5',
  'Jilid 6',
  'Al-Qur\'an',
  'Gharib',
  'Tajwid'
];

export interface UmmiSyllabusItem {
  jilid: string;
  title: string;
  totalPages: number;
  keyTopics: string[];
}

export const UMMI_SYLLABUS: UmmiSyllabusItem[] = [
  {
    jilid: 'Jilid 1',
    title: 'Pengenalan Huruf Tunggal Hijaiyyah Berharakat Fathah (A-Ba-Ta-Tsa)',
    totalPages: 40,
    keyTopics: ['Huruf Alif s/d Ya', 'Bunyi pendek dan tegas', 'Huruf bersambung 2-3 huruf']
  },
  {
    jilid: 'Jilid 2',
    title: 'Pengenalan Harakat Kasrah, Dhammah, dan Huruf Bersambung',
    totalPages: 40,
    keyTopics: ['Harakat Kasrah (I) & Dhammah (U)', 'Variasi harakat A-I-U', 'Angka Arab 1-100']
  },
  {
    jilid: 'Jilid 3',
    title: 'Mad Thabi\'i (Panjang 1 Alif / 2 Harakat)',
    totalPages: 40,
    keyTopics: ['Mad Alif, Ya Sukun, Wawu Sukun', 'Fathah berdiri / Mad Badal', 'Ketukan stabil 2 harakat']
  },
  {
    jilid: 'Jilid 4',
    title: 'Tanwin (Fathatain, Kasratain, Dhammatain), Sukun, & Qalqalah',
    totalPages: 40,
    keyTopics: ['Bunyi Tanwin An-In-Un', 'Huruf Mati (Sukun)', 'Qalqalah Ba-Jim-Dal-Tha-Qaf']
  },
  {
    jilid: 'Jilid 5',
    title: 'Tasydid, Ghunnah, dan Tanda Waqaf',
    totalPages: 40,
    keyTopics: ['Tasydid pada huruf Hijaiyyah', 'Ghunnah Nun & Mim Tasydid 2 ketukan', 'Kaidah Berhenti (Waqaf)']
  },
  {
    jilid: 'Jilid 6',
    title: 'Hukum Nun Sukun, Tanwin, Lafdzul Jalalah, & Mad Lazim',
    totalPages: 40,
    keyTopics: ['Idzhar, Idgham, Ikhfa, Iqlab', 'Tafkhim & Tarqiq Lafadz Allah', 'Mad 6 Harakat']
  },
  {
    jilid: 'Al-Qur\'an',
    title: 'Tilawah Al-Qur\'an Dewasa & Fashahah Tartil',
    totalPages: 604,
    keyTopics: ['Khatam Al-Qur\'an 30 Juz', 'Kelancaran tilawah bertempo', 'Penguasaan waqaf & ibtida\'']
  },
  {
    jilid: 'Gharib',
    title: 'Ayat-Ayat Gharib & Musykilat Riwayat Imam Hafs',
    totalPages: 30,
    keyTopics: ['Isymam, Imalah, Saktah', 'Tashil, Naql, Badala', 'Sujud Tilawah & Ayat Sajdah']
  },
  {
    jilid: 'Tajwid',
    title: 'Kaidah Teori Tajwid & Munaqasyah Sertifikasi',
    totalPages: 35,
    keyTopics: ['Matan Tuhfatul Athfal', 'Makhraj & Sifat Huruf', 'Hukum Mad & Ahkam Al-Huruf']
  }
];

export const INITIAL_MATERIALS: LearningMaterial[] = [
  // METODE UMMI
  {
    id: 'mat-ummi-1',
    title: 'Pengenalan Huruf Tunggal Hijaiyyah Berharakat Fathah (A-Ba)',
    name: 'Pengenalan Huruf Tunggal Hijaiyyah Berharakat Fathah (A-Ba)',
    category: 'Ummi',
    jilid: 'Jilid 1',
    level: 'Jilid 1',
    page: '1-10',
    description: 'Mengenal dan melafalkan huruf hijaiyyah tunggal berharakat fathah dengan bunyi pendek dan tegas.',
    content: 'Huruf Alif s/d Ya dibaca pendek 1 ketukan tanpa mengeja (A, Ba, Ta, Tsa...).',
    targetCompetence: 'Mampu membaca huruf hijaiyyah tunggal fathah secara langsung tanpa mengeja dan tidak terputus-putus.'
  },
  {
    id: 'mat-ummi-2',
    title: 'Huruf Bersambung Dua dan Tiga Huruf Fathah',
    name: 'Huruf Bersambung Dua dan Tiga Huruf Fathah',
    category: 'Ummi',
    jilid: 'Jilid 1',
    level: 'Jilid 1',
    page: '11-40',
    description: 'Membaca kombinasi huruf bersambung 2-3 huruf berharakat fathah secara lancar.',
    content: 'Bentuk huruf di awal, tengah, dan akhir kata dengan harakat fathah (contoh: ka-ta-ba, ja-a-la).',
    targetCompetence: 'Mampu membedakan bentuk huruf di awal, tengah, dan akhir kata.'
  },
  {
    id: 'mat-ummi-5',
    title: 'Mad Thabi\'i (Alif, Ya Sukun, Wawu Sukun)',
    name: 'Mad Thabi\'i (Alif, Ya Sukun, Wawu Sukun)',
    category: 'Ummi',
    jilid: 'Jilid 3',
    level: 'Jilid 3',
    page: '1-20',
    description: 'Mengenal dan mempraktikkan bacaan panjang 1 alif (2 harakat) dengan tanda mad.',
    content: 'Panjang 2 ketukan stabil pada huruf fathah diikuti alif, kasrah diikuti ya sukun, dan dhammah diikuti wawu sukun.',
    targetCompetence: 'Mampu membedakan bacaan pendek 1 ketukan dan panjang 2 ketukan secara presisi.'
  },
  {
    id: 'mat-ummi-8',
    title: 'Qalqalah (Baju Di Toko) pada Huruf Sukun',
    name: 'Qalqalah (Baju Di Toko) pada Huruf Sukun',
    category: 'Ummi',
    jilid: 'Jilid 4',
    level: 'Jilid 4',
    page: '21-40',
    description: 'Mempraktikkan pantulan suara qalqalah pada huruf Ba, Jim, Dal, Tha, Qaf saat sukun.',
    content: 'Huruf Qalqalah (Ba, Jim, Dal, Tha, Qaf) dibaca memantul ringan tanpa suara hamzah tambahan.',
    targetCompetence: 'Mampu membunyikan qalqalah sughra dengan pantulan yang tidak berlebihan.'
  },
  {
    id: 'mat-ummi-13',
    title: 'Gharib: Isymam, Imalah, Saktah, Tashil, Naql',
    name: 'Gharib: Isymam, Imalah, Saktah, Tashil, Naql',
    category: 'Gharib',
    jilid: 'Gharib',
    level: 'Gharib',
    page: '1-30',
    description: 'Mempelajari ayat-ayat musykilat / bacaan khusus dalam riwayat Imam Hafs \'an \'Ashim.',
    content: 'Majreha (Imalah Surat Hud:41), La\'tamanna (Isymam Surat Yusuf:11), Saktah pada 4 tempat.',
    targetCompetence: 'Mampu melafalkan bacaan gharib sesuai contoh talaqqi guru bersanad.'
  },
  {
    id: 'mat-tajwid-1',
    title: 'Hukum Nun Sukun dan Tanwin: Izhar Halqi',
    name: 'Hukum Nun Sukun dan Tanwin: Izhar Halqi',
    category: 'Tajwid',
    level: 'Lanjutan',
    description: 'Membaca nun mati/tanwin dengan jelas tanpa dengung saat bertemu 6 huruf tenggorokan.',
    content: 'Huruf Izhar: Hamzah, Ha, \'Ain, Haa, Ghain, Kha (Contoh: man aamana, min khairin).',
    targetCompetence: 'Pelafalan jelas 100% tanpa diputus atau diseret.'
  },
  {
    id: 'mat-tahsin-1',
    title: 'Makharijul Huruf: Al-Halq (Tenggorokan)',
    name: 'Makharijul Huruf: Al-Halq (Tenggorokan)',
    category: 'Tahsin',
    level: 'Dasar',
    description: 'Tempat keluarnya huruf dari tenggorokan bawah, tengah, dan atas.',
    content: 'Aqshal Halq (Pangkal): Hamzah & Ha. Wasathal Halq (Tengah): \'Ain & Haa. Adnal Halq (Ujung): Ghain & Kha.',
    targetCompetence: 'Mampu membedakan artikulasi \'Ain dan Hamzah serta Haa dan Ha besar.'
  }
];
