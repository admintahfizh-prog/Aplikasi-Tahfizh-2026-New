import { LearningMaterial } from '../types';

export const UMMI_JILIDS = [
  'Jilid 1',
  'Jilid 2',
  'Jilid 3',
  'Al-Qur\'an',
  'Gharib',
  'Tajwid'
];

export interface UmmiTopicDetail {
  pageRange: string;
  topicTitle: string;
  arabicExample: string;
  rules: string;
  competency: string;
  teachingTips: string;
}

export interface UmmiSyllabusItem {
  jilid: string;
  title: string;
  totalPages: number;
  description: string;
  keyTopics: string[];
  modules: UmmiTopicDetail[];
}

export const UMMI_SYLLABUS: UmmiSyllabusItem[] = [
  {
    jilid: 'Jilid 1',
    title: 'Buku Ummi Dewasa Jilid 1: Pengenalan Huruf Hijaiyyah Tunggal & Sambung, Harakat A-I-U, dan Mad Thabi\'i',
    totalPages: 40,
    description: 'Fokus pada pengenalan 28 huruf hijaiyyah tunggal & sambung berharakat Fathah (A), Kasrah (I), Dhammah (U), ketukan pendek 1 harakat murni tanpa mengeja, kata dasar bahasa Arab, serta pemanjangan Mad Thabi\'i / Asli 2 harakat (Alif, Ya Sukun, Wawu Sukun, dan Baris Berdiri).',
    keyTopics: [
      'Huruf Tunggal Hijaiyyah Fathah (Alif s/d Ya) - 1 Ketukan Tegas',
      'Huruf Bersambung 2 & 3 Huruf (Kata Dasar Arab)',
      'Harakat Kasrah (I) & Dhammah (U) serta Variasi A-I-U',
      'Mad Thabi\'i / Asli (Fathah+Alif, Kasrah+Ya Sukun, Dhammah+Wawu Sukun) 2 Harakat',
      'Fathah Berdiri, Kasrah Berdiri, & Dhammah Terbalik (Mad Badal & Shilah)'
    ],
    modules: [
      {
        pageRange: 'Hal 1 - 10',
        topicTitle: 'Huruf Tunggal Hijaiyyah Fathah (Alif s/d Dzal) & Sambung 2 Huruf',
        arabicExample: 'اَ  بَ  تَ  ثَ  جَ  حَ  خَ  دَ  ذَ  -  بَتَ  جَحَ  سَشَ  كَلَ',
        rules: 'Dibaca langsung bunyi pendek (1 ketukan) tanpa dieja (A, Ba, Ta, Tsa...). Dilarang memanjangkan atau mengayunkan bacaan. Perhatikan perubahan bentuk kepala huruf ketika bersambung dua huruf.',
        competency: 'Santri mampu melafalkan huruf hijaiyyah tunggal fathah dan sambung 2 huruf dengan makhraj tepat dan tempo stabil tanpa mengeja.',
        teachingTips: 'Gunakan metode peraga Ummi Dewasa secara klasikal, drill artikulasi makhraj, pastikan tidak ada santri yang mengeja.'
      },
      {
        pageRange: 'Hal 11 - 20',
        topicTitle: 'Harakat Kasrah (I), Dhammah (U), & Variasi Kombinasi A-I-U',
        arabicExample: 'اِ  بِ  تِ  -  اُ  بُ  تُ  -  بَ بِ بُ  -  تَ تِ تُ  -  كُتِبَ  خُلِقَ  عَمِلَ  شَهِدَ',
        rules: 'Kasrah berbunyi "I" murni (meringis, bukan "E"). Dhammah berbunyi "U" murni (monyong sempurna, bukan "O"). Latihan variasi 3 harakat pada kata multi-harakat secara lancar.',
        competency: 'Santri mampu berpindah harakat A-I-U dengan gerakan bibir (tathbiq harakat) yang lentur, tepat, dan bertempo.',
        teachingTips: 'Koreksi santri yang masih melafalkan kasrah seperti "E" (misal: "bila" bukan "bela") atau dhammah seperti "O".'
      },
      {
        pageRange: 'Hal 21 - 30',
        topicTitle: 'Mad Thabi\'i / Asli (Panjang 2 Harakat / 1 Ayunan): Alif, Ya Sukun, & Wawu Sukun',
        arabicExample: 'بَا  تَا  جَا  -  بِيْ  تِيْ  جِيْ  -  بُوْ  تُوْ  جُوْ  -  قَالَ  دِيْنِ  يَقُوْلُ  فِيْهَا',
        rules: 'Fathah diikuti Alif, Kasrah diikuti Ya sukun, dan Dhammah diikuti Wawu sukun dibaca panjang tepat 2 harakat (1 ayunan lembut / 2 ketukan stabil). Tidak boleh kurang atau lebih.',
        competency: 'Santri mampu membedakan huruf pendek 1 ketukan dan huruf mad 2 ketukan secara kontras dan konsisten.',
        teachingTips: 'Gunakan ketukan jari atau gerakan tangan 1 ayunan untuk melatih kestabilan 2 harakat mad thabi\'i.'
      },
      {
        pageRange: 'Hal 31 - 40',
        topicTitle: 'Fathah/Kasrah/Dhammah Berdiri & Munaqasyah Kenaikan Jilid 1 Dewasa',
        arabicExample: 'هٰذَا - ذٰلِكَ - اِلٰهِ - كِتٰبُهُۥ - بِهٖ - لَهٗ - جَاهَدَ يُجَاهِدُ',
        rules: 'Tanda baris berdiri / terbalik berfungsi sama dengan Mad Thabi\'i (dibaca panjang tepat 2 harakat). Menjaga mizan timbangan harakat pendek vs panjang.',
        competency: 'Lulus Munaqasyah Ummi Dewasa Jilid 1 dengan nilai minimal 75 (Lancar, makhraj jelas, ketukan mad 100% tepat).',
        teachingTips: 'Lakukan evaluasi individual komprehensif halaman 39-40 sebagai syarat kenaikan ke Jilid 2 Dewasa.'
      }
    ]
  },
  {
    jilid: 'Jilid 2',
    title: 'Buku Ummi Dewasa Jilid 2: Tanwin, Huruf Sukun, Kaidah Qalqalah, Tasydid, Ghunnah, & Kaidah Waqaf',
    totalPages: 40,
    description: 'Fokus pada penguasaan bunyi tanwin (-An, -In, -Un), pengucapan huruf sukun non-qalqalah tanpa memantul, kaidah pantulan qalqalah (Baju Di Toko), penekanan tanda tasydid, dengung ghunnah musyaddadah 2-3 ketukan di hidung, serta kaidah waqaf di akhir ayat.',
    keyTopics: [
      'Tanwin (Fathatain -An, Kasratain -In, Dhammatain -Un) & Angka Arab 1-100',
      'Huruf Sukun (Mati) Non-Qalqalah (Hams & Rakhawah)',
      'Kaidah Qalqalah Sughra & Kubra (ب ج د ط ق / Baju Di Toko)',
      'Tanda Tasydid / Syaddah Umum (Penekanan Suara 2 Huruf)',
      'Ghunnah Musyaddadah (Nun & Mim Bertasydid 2-3 Ketukan Rongga Hidung)',
      'Kaidah Waqaf (Mematikan Akhir Ayat, Ta Marbuthah, Mad \'Iwadh)'
    ],
    modules: [
      {
        pageRange: 'Hal 1 - 10',
        topicTitle: 'Tanwin (Fathatain, Kasratain, Dhammatain) & Angka Arab 1-100',
        arabicExample: 'بًا  بٍ  بٌ  -  كِتَابًا  -  رَحْمَةٍ  -  عَلِيْمٌ  -  غَفُوْرٌ  |  ١  ٢  ٣  ...  ١٠٠',
        rules: 'Tanwin dibaca bunyi "N" di ujung kata dengan tempo pendek 1 ketukan bila belum bertemu hukum tajwid. Mengenal angka Arab untuk navigasi nomor ayat dan halaman mushaf.',
        competency: 'Santri melafalkan -An, -In, -Un secara tegas dan cepat tanpa memanjangkan serta mengenali nomor ayat Arab.',
        teachingTips: 'Jelaskan bahwa tanwin pada dasarnya adalah nun sukun yang menyatu dalam bunyi vokal.'
      },
      {
        pageRange: 'Hal 11 - 20',
        topicTitle: 'Huruf Sukun Non-Qalqalah & Kaidah Qalqalah (ب ج د ط ق)',
        arabicExample: 'يَأْكُلُ - نَعْبُدُ - مُسْلِمُوْنَ  |  اَبْ - اَجْ - اَدْ - اَطْ - اَقْ - يَجْعَلُوْنَ - تَقْوَى',
        rules: 'Huruf sukun selain qalqalah dibaca mati tanpa memantul (alirkan hams/nafas). Huruf Qalqalah (Ba, Jim, Dal, Tha, Qaf) saat sukun WAJIB memantul bening dan ringan tanpa hamzah siluman.',
        competency: 'Mampu membedakan huruf sukun yang tidak memantul vs pantulan qalqalah sughra secara fasih.',
        teachingTips: 'Gunakan jembatan keledai "Baju Di Toko" (Ba, Jim, Dal, Tha, Qaf) dan drill satu per satu.'
      },
      {
        pageRange: 'Hal 21 - 30',
        topicTitle: 'Tanda Tasydid / Syaddah Umum & Ghunnah Musyaddadah (Nun & Mim Tasydid)',
        arabicExample: 'رَبَّ - كُلَّ - حَقَّ  |  اِنَّ - ثُمَّ - عَمَّ - مِنَ الْجِنَّةِ وَالنَّاسِ',
        rules: 'Huruf bertasydid ditekan seberat 2 huruf (Nabrah). Nun bertasydid dan Mim bertasydid WAJIB dibaca berdengung (Ghunnah) sempurna ditahan 2-3 ketukan di rongga hidung.',
        competency: 'Mampu menahan dengung ghunnah musyaddadah dengan durasi stabil sebelum melepas ke huruf berikutnya.',
        teachingTips: 'Minta santri merasakan getaran dengung khaisyum di pangkal hidung saat membaca Nun/Mim tasydid.'
      },
      {
        pageRange: 'Hal 31 - 40',
        topicTitle: 'Kaidah Waqaf (Cara Berhenti) & Munaqasyah Kenaikan Jilid 2 Dewasa',
        arabicExample: 'الْعَالَمِيْنَ ⬅ الْعَالَمِيْنْ  |  رَحْمَةً ⬅ رَحْمَهْ  |  مُسْتَقِيْمًا ⬅ مُسْتَقِيْمَا',
        rules: 'Huruf terakhir dimatikan (Sukun \'Aridh). Ta marbuthah (ة/ـة) berubah menjadi Ha sukun (هـْ). Fathatain (-an) berubah menjadi mad 2 harakat (Mad \'Iwadh).',
        competency: 'Lulus Munaqasyah Jilid 2 Dewasa (Menguasai tanwin, sukun, qalqalah, tasydid, ghunnah, dan waqaf).',
        teachingTips: 'Latih pernapasan dan pengaturan nafas santri saat membaca potongan ayat bertasydid dan berwaqaf.'
      }
    ]
  },
  {
    jilid: 'Jilid 3',
    title: 'Buku Ummi Dewasa Jilid 3: Hukum Nun Sukun/Tanwin, Mim Sukun, Tafkhim/Tarqiq, Hukum Mad Far\'i, & Munaqasyah Khatam',
    totalPages: 40,
    description: 'Fokus pada hukum tajwid aplikatif: Idzhar Halqi, Idgham Bighunnah & Bilaghunnah, Iqlab, Ikhfa Haqiqi (15 huruf), Hukum Mim Sukun (Idzhar/Ikhfa/Idgham), Lafadz Allah tebal/tipis, Mad Wajib/Jaiz/Lazim 6 harakat, dan Munaqasyah Khatam Ummi Dewasa menuju Al-Qur\'an Besar.',
    keyTopics: [
      'Hukum Nun Sukun & Tanwin: Idzhar Halqi, Idgham Bighunnah, Idgham Bilaghunnah',
      'Hukum Iqlab (ke Mim) & Ikhfa Haqiqi (15 Huruf Samar 2 Ketukan)',
      'Hukum Mim Sukun (Idzhar Syafawi, Ikhfa Syafawi, Idgham Mimi)',
      'Tafkhim & Tarqiq Lafadz Jalalah (Allah / Lillah)',
      'Hukum Mad Lanjutan (Mad Wajib 4-5 Harakat, Mad Jaiz, Mad Lazim 6 Harakat)',
      'Munaqasyah Akbar Khatam Ummi Dewasa (Sertifikasi Naik ke Al-Qur\'an)'
    ],
    modules: [
      {
        pageRange: 'Hal 1 - 10',
        topicTitle: 'Nun Sukun & Tanwin: Idzhar Halqi, Idgham Bighunnah, & Idgham Bilaghunnah',
        arabicExample: 'مَنْ اٰمَنَ - مِنْ خَيْرٍ  |  مَنْ يَّقُوْلُ - مِّنْ مَّالٍ  |  مِنْ رَّبِّهِمْ - هُدًى لِّلْمُتَّقِيْنَ',
        rules: 'Idzhar (ء هـ ع ح غ خ) dibaca jelas tanpa dengung. Idgham Bighunnah (ي ن م و) melebur berdengung 2 ketukan. Idgham Bilaghunnah (ل ر) melebur tanpa dengung.',
        competency: 'Mampu menerapkan Idzhar dan Idgham secara spontan saat tilawah mushaf.',
        teachingTips: 'Gunakan tanda harakat mushaf Madinah: tanwin sejajar = idzhar; tanwin tidak sejajar = idgham/ikhfa.'
      },
      {
        pageRange: 'Hal 11 - 20',
        topicTitle: 'Hukum Iqlab & Ikhfa Haqiqi (15 Huruf Samar Dengung 2 Ketukan)',
        arabicExample: 'مِنْ بَعْدِ ⬅ مِمْبَعْدِ  |  مِنْ قَبْلِ - اَنْفُسَكُمْ - كُنْتُمْ - كِتَابٌ كَرِيْمٌ',
        rules: 'Iqlab merapatkan bibir ringan berbunyi Mim dengung. Ikhfa menyamarkan nun sukun pada 15 huruf dengan dengung 2 ketukan menuju makhraj huruf berikutnya.',
        competency: 'Menguasai 15 huruf ikhfa haqiqi dan melafalkan dengung sesuai tebal/tipisnya huruf berikutnya.',
        teachingTips: 'Arahkan posisi lidah sudah siap di makhraj huruf tujuan saat mendengungkan ikhfa.'
      },
      {
        pageRange: 'Hal 21 - 30',
        topicTitle: 'Hukum Mim Sukun & Tafkhim/Tarqiq Lafadz Allah',
        arabicExample: 'هُمْ فِيْهَا (Idzhar) - تَرْمِيْهِمْ بِحِجَارَةٍ (Ikhfa) - لَهُمْ مَّا (Idgham)  |  قُلْ هُوَ اللّٰهُ - بِسْمِ اللّٰهِ',
        rules: 'Mim sukun: Ikhfa Syafawi (bertemu Ba), Idgham Mimi (bertemu Mim), Idzhar Syafawi (selain Ba & Mim). Lafadz Allah dibaca tebal (Tafkhim) setelah fathah/dhammah dan tipis (Tarqiq) setelah kasrah.',
        competency: 'Penerapan hukum mim sukun dan nama Allah secara fasih tanpa salah tebal/tipis.',
        teachingTips: 'Waspadai huruf Wawu dan Fa setelah Mim sukun agar tidak dibaca mendengung (Idzhar Syafawi mutlak).'
      },
      {
        pageRange: 'Hal 31 - 40',
        topicTitle: 'Mad Wajib, Mad Jaiz, Mad Lazim 6 Harakat, & Munaqasyah Akbar Ummi Dewasa',
        arabicExample: 'جَآءَ (4-5 Harakat) - يَآاَيُّهَا (4-5 Harakat) - وَلَا الضَّآلِّيْنَ (6 Harakat)',
        rules: 'Tanda alis/pedang dibaca 4-5 harakat (Mad Wajib/Jaiz). Mad bertemu huruf bertasydid dibaca Mad Lazim 6 harakat penuh. Evaluasi kelulusan seluruh materi Ummi Dewasa Jilid 1-3.',
        competency: 'Lulus Munaqasyah Akbar Khatam Ummi Dewasa dan resmi bersertifikat naik ke Tilawah Mushaf Al-Qur\'an Besar.',
        teachingTips: 'Siapkan santri untuk ujian munaqasyah komprehensif seluruh materi Jilid 1 sampai 3 Ummi Dewasa.'
      }
    ]
  },
  {
    jilid: 'Al-Qur\'an',
    title: 'Tilawah Mushaf Al-Qur\'an 30 Juz & Fashahah Tartil Ummi Dewasa',
    totalPages: 604,
    description: 'Penerapan seluruh kaidah tajwid dan fashahah pada mushaf Al-Qur\'an 30 Juz secara tartil, bertempo, dan menguasai waqaf ibtida\'.',
    keyTopics: [
      'Khatam Al-Qur\'an 30 Juz',
      'Kelancaran Tilawah Bertempo Tartil',
      'Penguasaan Waqaf & Ibtida\' Sempurna',
      'Fashahah dan Lahn Jaliy/Khafiy',
      'Persiapan Sertifikasi & Munaqasyah Khatam Al-Qur\'an'
    ],
    modules: [
      {
        pageRange: 'Juz 1 - 30',
        topicTitle: 'Tilawah Al-Qur\'an 30 Juz dengan Kaidah Tartil Ummi',
        arabicExample: 'الٓمٓ ۝ ذٰلِكَ الْكِتٰبُ لَا رَيْبَ ۛ فِيْهِ ۛ هُدًى لِّلْمُتَّقِيْنَ',
        rules: 'Membaca mushaf standar rasm Utsmani dengan tempo tartil stabil, menjaga waqaf, serta menjaga hak dan mustahak setiap huruf.',
        competency: 'Mampu tilawah mandiri minimal 1-2 juz per minggu dengan kualitas fashahah mumtaz.',
        teachingTips: 'Gunakan sistem tadarus talaqqi guru-murid dan simak berpasangan harian.'
      }
    ]
  },
  {
    jilid: 'Gharib',
    title: 'Ayat-Ayat Gharib & Musykilat Riwayat Imam Hafs \'an \'Ashim',
    totalPages: 30,
    description: 'Kajian mendalam mengenai bacaan khusus / asing dalam Al-Qur\'an (Isymam, Imalah, Saktah, Tashil, Naql, Badala, Shilah Thawilah).',
    keyTopics: [
      'Isymam (Surat Yusuf: 11)',
      'Imalah (Surat Hud: 41)',
      'Saktah (4 Tempat dalam Al-Qur\'an)',
      'Tashil (Surat Fushshilat: 44)',
      'Naql (Surat Al-Hujurat: 11) & Ayat Sajdah'
    ],
    modules: [
      {
        pageRange: 'Hal 1 - 30',
        topicTitle: 'Kaidah Bacaan Gharib & Musykilat Al-Qur\'an',
        arabicExample: 'مَجْر۪ىهَا (Imalah) - لَا تَأْمَ۫نَّا (Isymam) - كَلَّا بَلْ ۜ رَانَ (Saktah) - ءَا۬عْجَمِيٌّ (Tashil)',
        rules: 'Wajib dipelajari secara talaqqi musyafahah langsung dari guru bersanad karena tidak dapat dibaca hanya berdasarkan teks biasa.',
        competency: 'Santri menguasai seluruh 20+ titik bacaan gharib di dalam Al-Qur\'an beserta letak surat dan ayatnya.',
        teachingTips: 'Gunakan buku panduan Gharib Ummi dan drill satu per satu titik gharib musykilat.'
      }
    ]
  },
  {
    jilid: 'Tajwid',
    title: 'Teori Kaidah Ilmu Tajwid & Munaqasyah Sertifikasi Ummi Foundation',
    totalPages: 35,
    description: 'Pendalaman teori kaidah tajwid ilmiah bersumber dari Matan Tuhfatul Athfal dan Jazariyyah sebagai syarat munaqasyah sertifikasi pengajar & santri unggulan.',
    keyTopics: [
      'Matan Tuhfatul Athfal',
      'Makharijul Huruf (17 Tempat Keluar Huruf)',
      'Shifatul Huruf (Sifat Lazimah & Aridhah)',
      'Ahkam Al-Madd wal Qashr',
      'Ahkam Al-Waqf wal Ibtida\''
    ],
    modules: [
      {
        pageRange: 'Hal 1 - 35',
        topicTitle: 'Kaidah Teori Tajwid & Munaqasyah Sertifikasi',
        arabicExample: 'أَحْكَامُ نُونٍ سَاكِنٍ وَتَنْوِينِ - لِلنُّونِ إِنْ تَسْكُنْ وَلِلتَّنْوِينِ أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي',
        rules: 'Memahami landasan dalil bait nadzam tajwid, definisi istilah ilmu tajwid, dan mampu menjelaskan kaidah secara ilmiah.',
        competency: 'Lulus Ujian Teori Tajwid Munaqasyah Ummi Foundation dengan predikat Mumtaz (A).',
        teachingTips: 'Latih santri menghafalkan bait-bait penting Tuhfatul Athfal dan menghubungkannya dengan praktik tilawah.'
      }
    ]
  }
];

export const INITIAL_MATERIALS: LearningMaterial[] = [
  // ==========================================
  // BUKU UMMI DEWASA JILID 1 (4 MODUL LENGKAP)
  // ==========================================
  {
    id: 'mat-ummi-1-1',
    title: 'Ummi Dewasa Jilid 1: Pengenalan Huruf Tunggal Hijaiyyah & Sambung 2 Huruf (Fathah A)',
    name: 'Ummi Dewasa Jilid 1: Pengenalan Huruf Tunggal Hijaiyyah & Sambung 2 Huruf (Fathah A)',
    category: 'Ummi',
    jilid: 'Jilid 1',
    level: 'Jilid 1',
    page: '1-10',
    description: 'Mengenal dan melafalkan 28 huruf hijaiyyah tunggal dan sambung berharakat fathah (Alif s/d Ya) dengan bunyi pendek dan tegas 1 ketukan murni.',
    content: 'Kaidah Pokok:\n• Huruf Alif s/d Ya dibaca langsung pendek 1 ketukan tanpa mengeja (A, Ba, Ta, Tsa, Ja, Ha, Kha, Da, Dza...).\n• Dilarang mengayunkan atau memanjangkan bacaan.\n• Mengenal perubahan kepala huruf saat bersambung dua huruf (بَتَ, جَحَ, سَشَ, كَلَ).\n• Contoh Lafadz: اَ بَ تَ ثَ - جَ حَ خَ - دَ ذَ - رَ زَ سَ',
    targetCompetence: 'Mampu membaca huruf tunggal dan sambung 2 huruf hijaiyyah fathah secara spontan tanpa mengeja dengan artikulasi makhraj fasih.'
  },
  {
    id: 'mat-ummi-1-2',
    title: 'Ummi Dewasa Jilid 1: Harakat Kasrah (I), Dhammah (U), & Variasi Kombinasi A-I-U',
    name: 'Ummi Dewasa Jilid 1: Harakat Kasrah (I), Dhammah (U), & Variasi Kombinasi A-I-U',
    category: 'Ummi',
    jilid: 'Jilid 1',
    level: 'Jilid 1',
    page: '11-20',
    description: 'Mengenal harakat kasrah (I) dan dhammah (U) murni serta mempraktikkan variasi A-I-U pada kata multi harakat.',
    content: 'Kaidah Pokok:\n• Kasrah berbunyi "I" murni (meringis, bukan "E").\n• Dhammah berbunyi "U" murni (monyong, bukan "O").\n• Latihan variasi 3 harakat: Ba-Bi-Bu, Ta-Ti-Tu, Tsa-Tsi-Tsu, Ja-Ji-Ju.\n• Contoh Lafadz: كُتِبَ - خُلِقَ - رُسُلُ - حَسُنَ - عَمِلَ - شَهِدَ',
    targetCompetence: 'Mampu melafalkan variasi 3 harakat (A-I-U) dengan gerakan bibir (tathbiq harakat) yang lentur dan tepat pada kata 3-4 huruf.'
  },
  {
    id: 'mat-ummi-1-3',
    title: 'Ummi Dewasa Jilid 1: Mad Thabi\'i / Asli (Panjang 2 Harakat / 1 Ayunan)',
    name: 'Ummi Dewasa Jilid 1: Mad Thabi\'i / Asli (Panjang 2 Harakat / 1 Ayunan)',
    category: 'Ummi',
    jilid: 'Jilid 1',
    level: 'Jilid 1',
    page: '21-30',
    description: 'Mempraktikkan bacaan panjang 1 alif (tepat 2 harakat) pada Fathah+Alif, Kasrah+Ya sukun, dan Dhammah+Wawu sukun.',
    content: 'Kaidah Pokok:\n• Fathah diikuti Alif (بَا), Kasrah diikuti Ya sukun (بِيْ), dan Dhammah diikuti Wawu sukun (بُوْ) dibaca panjang tepat 2 harakat (1 ayunan lembut).\n• Dilarang membaca kurang dari 2 harakat atau melebihi 2 harakat.\n• Contoh Lafadz: قَالَ - كَانَ - صَابِرًا - دِيْنِ - يَقُوْلُ - فِيْهَا - نُوْحِيْهَا',
    targetCompetence: 'Mampu membedakan bacaan pendek 1 ketukan dan panjang 2 ketukan secara presisi dan konsisten.'
  },
  {
    id: 'mat-ummi-1-4',
    title: 'Ummi Dewasa Jilid 1: Fathah/Kasrah/Dhammah Berdiri & Munaqasyah Jilid 1',
    name: 'Ummi Dewasa Jilid 1: Fathah/Kasrah/Dhammah Berdiri & Munaqasyah Jilid 1',
    category: 'Ummi',
    jilid: 'Jilid 1',
    level: 'Jilid 1',
    page: '31-40',
    description: 'Mengenal tanda baca mad berdiri (Mad Badal & Shilah Qashirah) rasm Utsmani serta evaluasi kenaikan ke Jilid 2 Dewasa.',
    content: 'Kaidah Pokok:\n• Fathah tegak (ٰ) = 2 harakat. Kasrah tegak (ٖ) = 2 harakat. Dhammah terbalik (ٗ/ۥ) = 2 harakat.\n• Menjaga mizan irama membaca agar tidak mencuri harakat pendek dan tidak memotong huruf mad.\n• Contoh Lafadz: هٰذَا - ذٰلِكَ - اِلٰهِ - كِتٰبُهُۥ - بِهٖ - لَهٗ - دَاوٗدُ - جَاهَدَ يُجَاهِدُ',
    targetCompetence: 'Lulus Munaqasyah Kenaikan Jilid 1 Ummi Dewasa dengan nilai minimal 75 (Lancar, tidak mengeja, makhraj tepat, ketukan mad konsisten).'
  },

  // ==========================================
  // BUKU UMMI DEWASA JILID 2 (4 MODUL LENGKAP)
  // ==========================================
  {
    id: 'mat-ummi-2-1',
    title: 'Ummi Dewasa Jilid 2: Tanwin (Fathatain, Kasratain, Dhammatain) & Angka Arab 1-100',
    name: 'Ummi Dewasa Jilid 2: Tanwin (Fathatain, Kasratain, Dhammatain) & Angka Arab 1-100',
    category: 'Ummi',
    jilid: 'Jilid 2',
    level: 'Jilid 2',
    page: '1-10',
    description: 'Mengenal bunyi tanwin -An, -In, -Un pada akhir kata dan membacanya secara tepat 1 ketukan serta navigasi angka Arab.',
    content: 'Kaidah Pokok:\n• Tanwin berbunyi nun mati di akhir kata: Fathatain (-an), Kasratain (-in), Dhammatain (-un).\n• Dibaca pendek 1 ketukan bila belum bertemu hukum tajwid.\n• Angka Arab: ١, ٢, ٣, ٤, ٥, ٦, ٧, ٨, ٩, ١٠ sampai ١٠٠ untuk navigasi ayat mushaf.\n• Contoh Lafadz: بًا بٍ بٌ - كِتَابًا - رَحْمَةٍ - عَلِيْمٌ - غَفُوْرٌ',
    targetCompetence: 'Mampu melafalkan fathatain, kasratain, dan dhammatain secara cepat dan tepat serta mengenali nomor ayat Arab.'
  },
  {
    id: 'mat-ummi-2-2',
    title: 'Ummi Dewasa Jilid 2: Huruf Sukun Non-Qalqalah & Kaidah Qalqalah (ب ج د ط ق)',
    name: 'Ummi Dewasa Jilid 2: Huruf Sukun Non-Qalqalah & Kaidah Qalqalah (ب ج د ط ق)',
    category: 'Ummi',
    jilid: 'Jilid 2',
    level: 'Jilid 2',
    page: '11-20',
    description: 'Membaca huruf sukun non-qalqalah dengan sifat Hams/Rakhawah tanpa memantul, serta mempraktikkan pantulan qalqalah sughra pada Ba, Jim, Dal, Tha, Qaf.',
    content: 'Kaidah Pokok:\n• Huruf sukun non-qalqalah dibaca mati tanpa timbul pantulan tambahan (tidak boleh "tak-e", "sak-e").\n• Huruf Qalqalah (ب ج د ط ق / Baju Di Toko) dibaca memantul ringan, bening, dan proporsional.\n• Contoh Lafadz: يَأْكُلُ - فَتْحًا - نَعْبُدُ - مُسْلِمُوْنَ | اَبْ - اَجْ - اَدْ - اَطْ - اَقْ - يَجْعَلُوْنَ - تَقْوَى',
    targetCompetence: 'Mampu membunyikan huruf sukun murni dan pantulan qalqalah sughra secara fasih.'
  },
  {
    id: 'mat-ummi-2-3',
    title: 'Ummi Dewasa Jilid 2: Tanda Tasydid & Ghunnah Musyaddadah (Nun & Mim Tasydid)',
    name: 'Ummi Dewasa Jilid 2: Tanda Tasydid & Ghunnah Musyaddadah (Nun & Mim Tasydid)',
    category: 'Ummi',
    jilid: 'Jilid 2',
    level: 'Jilid 2',
    page: '21-30',
    description: 'Membaca huruf bertasydid (penekanan 2 huruf) dan mendengungkan Nun/Mim tasydid 2-3 ketukan di rongga hidung.',
    content: 'Kaidah Pokok:\n• Huruf bertasydid (ّ) ditekan suaranya (Nabrah) tanpa mengubah makhraj asli.\n• Nun tasydid (نّ) dan Mim tasydid (مّ) WAJIB berdengung (Ghunnah) ditahan 2-3 ketukan dari rongga hidung (Khaisyum).\n• Contoh Lafadz: رَبَّ - كُلَّ - حَقَّ | اِنَّ - ثُمَّ - عَمَّ - اِنَّ الَّذِيْنَ - مِنَ الْجِنَّةِ وَالنَّاسِ',
    targetCompetence: 'Mampu menahan dengung ghunnah musyaddadah dengan durasi stabil sebelum melepas ke huruf berikutnya.'
  },
  {
    id: 'mat-ummi-2-4',
    title: 'Ummi Dewasa Jilid 2: Kaidah Waqaf di Akhir Ayat & Munaqasyah Jilid 2',
    name: 'Ummi Dewasa Jilid 2: Kaidah Waqaf di Akhir Ayat & Munaqasyah Jilid 2',
    category: 'Ummi',
    jilid: 'Jilid 2',
    level: 'Jilid 2',
    page: '31-40',
    description: 'Mempelajari kaidah mematikan huruf di akhir ayat, perubahan Ta Marbuthah menjadi Ha sukun, Mad \'Iwadh, dan ujian kenaikan Jilid 3.',
    content: 'Kaidah Pokok:\n• Huruf terakhir dimatikan (Sukun \'Aridh).\n• Ta Marbuthah (ة/ـة) di akhir ayat dibaca "H" mati (هـْ).\n• Fathatain (-an) di akhir ayat berubah menjadi mad 2 harakat (Mad \'Iwadh: Aa).\n• Contoh Lafadz: الْعَالَمِيْنَ ⬅ الْعَالَمِيْنْ | رَحْمَةً ⬅ رَحْمَهْ | مُسْتَقِيْمًا ⬅ مُسْتَقِيْمَا',
    targetCompetence: 'Lulus Munaqasyah Kenaikan Jilid 2 Ummi Dewasa (Standar Pra Jilid 3 Tajwid Lanjutan).'
  },

  // ==========================================
  // BUKU UMMI DEWASA JILID 3 (4 MODUL LENGKAP)
  // ==========================================
  {
    id: 'mat-ummi-3-1',
    title: 'Ummi Dewasa Jilid 3: Hukum Nun Sukun & Tanwin (Idzhar, Idgham Bighunnah & Bilaghunnah)',
    name: 'Ummi Dewasa Jilid 3: Hukum Nun Sukun & Tanwin (Idzhar, Idgham Bighunnah & Bilaghunnah)',
    category: 'Ummi',
    jilid: 'Jilid 3',
    level: 'Jilid 3',
    page: '1-10',
    description: 'Menerapkan hukum Idzhar Halqi (jelas tanpa dengung), Idgham Bighunnah (melebur berdengung 2 ketukan), dan Idgham Bilaghunnah (melebur tanpa dengung).',
    content: 'Kaidah Pokok:\n• Idzhar Halqi (ء هـ ع ح غ خ): Dibaca jelas 100% tanpa dengung.\n• Idgham Bighunnah (ي ن م و): Melebur dengan dengung ditahan 2 ketukan.\n• Idgham Bilaghunnah (ل ر): Melebur tanpa dengung.\n• Contoh Lafadz: مَنْ اٰمَنَ - مِنْ خَيْرٍ | مَنْ يَّقُوْلُ - مِّنْ مَّالٍ | مِنْ رَّبِّهِمْ - هُدًى لِّلْمُتَّقِيْنَ',
    targetCompetence: 'Mampu membedakan hukum Idzhar dan Idgham secara spontan saat tilawah mushaf.'
  },
  {
    id: 'mat-ummi-3-2',
    title: 'Ummi Dewasa Jilid 3: Hukum Iqlab & Ikhfa Haqiqi (15 Huruf Samar Dengung 2 Ketukan)',
    name: 'Ummi Dewasa Jilid 3: Hukum Iqlab & Ikhfa Haqiqi (15 Huruf Samar Dengung 2 Ketukan)',
    category: 'Ummi',
    jilid: 'Jilid 3',
    level: 'Jilid 3',
    page: '11-20',
    description: 'Menerapkan hukum Iqlab (mengubah bunyi ke Mim dengung) dan Ikhfa Haqiqi (menyamarkan nun sukun dengan dengung 2 ketukan pada 15 huruf).',
    content: 'Kaidah Pokok:\n• Iqlab (Nun sukun/tanwin bertemu Ba): Bibir dirapatkan ringan berbunyi Mim dengung.\n• Ikhfa Haqiqi (15 huruf: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك): Bunyi Nun disamarkan dengan dengung 2 ketukan menuju makhraj huruf berikutnya.\n• Contoh Lafadz: مِنْ بَعْدِ ⬅ مِمْبَعْدِ | مِنْ قَبْلِ - اَنْفُسَكُمْ - كُنْتُمْ - كِتَابٌ كَرِيْمٌ',
    targetCompetence: 'Menguasai 15 huruf ikhfa haqiqi dan dengung yang proporsional sesuai tebal/tipisnya huruf berikutnya.'
  },
  {
    id: 'mat-ummi-3-3',
    title: 'Ummi Dewasa Jilid 3: Hukum Mim Sukun & Tafkhim/Tarqiq Lafadz Allah',
    name: 'Ummi Dewasa Jilid 3: Hukum Mim Sukun & Tafkhim/Tarqiq Lafadz Allah',
    category: 'Ummi',
    jilid: 'Jilid 3',
    level: 'Jilid 3',
    page: '21-30',
    description: 'Menerapkan Idzhar Syafawi, Ikhfa Syafawi, Idgham Mimi, serta tebal (tafkhim) dan tipisnya (tarqiq) lafadz Jalalah Allah.',
    content: 'Kaidah Pokok:\n• Mim Sukun: Ikhfa Syafawi (bertemu Ba), Idgham Mimi (bertemu Mim), Idzhar Syafawi (selain Ba & Mim dibaca jelas tanpa dengung).\n• Lafadz Allah: Tebal (Tafkhim) didahului fathah/dhammah; Tipis (Tarqiq) didahului kasrah.\n• Contoh Lafadz: هُمْ فِيْهَا - تَرْمِيْهِمْ بِحِجَارَةٍ - لَهُمْ مَّا | قُلْ هُوَ اللّٰهُ - بِسْمِ اللّٰهِ',
    targetCompetence: 'Ketepatan melafalkan hukum mim sukun dan nama Allah secara fasih tanpa salah tebal/tipis.'
  },
  {
    id: 'mat-ummi-3-4',
    title: 'Ummi Dewasa Jilid 3: Mad Wajib, Mad Jaiz, Mad Lazim 6 Harakat, & Munaqasyah Akbar Khatam',
    name: 'Ummi Dewasa Jilid 3: Mad Wajib, Mad Jaiz, Mad Lazim 6 Harakat, & Munaqasyah Akbar Khatam',
    category: 'Ummi',
    jilid: 'Jilid 3',
    level: 'Jilid 3',
    page: '31-40',
    description: 'Membaca mad tanda pedang 4-5 harakat, mad lazim 6 harakat penuh, serta munaqasyah kelulusan akbar khatam Ummi Dewasa menuju Al-Qur\'an.',
    content: 'Kaidah Pokok:\n• Mad Wajib Muttashil & Mad Jaiz Munfashil: Dibaca panjang 4-5 harakat (tanda alis/pedang).\n• Mad Lazim Kilmi Mutsaqqal: Dibaca panjang 6 harakat penuh saat mad bertemu huruf bertasydid.\n• Contoh Lafadz: جَآءَ - سُوْٓءَ - يَآاَيُّهَا - بِمَآ اُنْزِلَ - وَلَا الضَّآلِّيْنَ - الصَّآخَّةُ',
    targetCompetence: 'Lulus Munaqasyah Akbar Ummi Dewasa Jilid 1-3 dan resmi bersertifikat naik ke Tilawah Mushaf Al-Qur\'an Besar.'
  },

  // ==========================================
  // AL-QUR'AN, GHARIB, TAJWID, TAHSIN
  // ==========================================
  {
    id: 'mat-ummi-quran-1',
    title: 'Al-Qur\'an: Fashahah Tartil & Waqaf Ibtida\' 30 Juz',
    name: 'Al-Qur\'an: Fashahah Tartil & Waqaf Ibtida\' 30 Juz',
    category: 'Ummi',
    jilid: 'Al-Qur\'an',
    level: 'Al-Qur\'an',
    page: '1-604',
    description: 'Penerapan seluruh kaidah tajwid dan fashahah pada mushaf Al-Qur\'an 30 Juz secara tartil dan bertempo stabil.',
    content: 'Kaidah Pokok:\n• Menerapkan seluruh kaidah tajwid Ummi Dewasa Jilid 1-3 secara terpadu.\n• Menjaga adab tilawah, intonasi tartil Ummi, dan waqaf ibtida\' yang tepat.\n• Contoh Lafadz: الٓمٓ ۝ ذٰلِكَ الْكِتٰبُ لَا رَيْبَ ۛ فِيْهِ ۛ هُدًى لِّلْمُتَّقِيْنَ',
    targetCompetence: 'Mampu tilawah mandiri 30 juz Al-Qur\'an secara tartil, fasih, dan siap munaqasyah khatam.'
  },
  {
    id: 'mat-ummi-gharib-1',
    title: 'Gharib: Isymam, Imalah, Saktah, Tashil, Naql',
    name: 'Gharib: Isymam, Imalah, Saktah, Tashil, Naql',
    category: 'Gharib',
    jilid: 'Gharib',
    level: 'Gharib',
    page: '1-30',
    description: 'Mempelajari ayat-ayat musykilat / bacaan khusus dalam riwayat Imam Hafs \'an \'Ashim.',
    content: 'Kaidah Pokok:\n• Majreha (Imalah Surat Hud:41) - Bunyi vokal miring antara fathah dan kasrah.\n• La\'tamanna (Isymam Surat Yusuf:11) - Memonyongkan bibir tanpa suara saat dengung.\n• Saktah pada 4 tempat (Al-Kahfi: 1, Yasin: 52, Al-Qiyamah: 27, Al-Muthaffifin: 14) - Berhenti 1 alif tanpa bernafas.\n• Tashil (Fushshilat: 44) - Meringankan hamzah kedua.\n• Naql (Al-Hujurat: 11) - Memindahkan harakat hamzah ke huruf lam sebelumnya.',
    targetCompetence: 'Mampu melafalkan bacaan gharib sesuai contoh talaqqi guru bersanad dan menghafal letak surat/ayatnya.'
  },
  {
    id: 'mat-tajwid-1',
    title: 'Hukum Nun Sukun dan Tanwin: Idzhar Halqi',
    name: 'Hukum Nun Sukun dan Tanwin: Idzhar Halqi',
    category: 'Tajwid',
    jilid: 'Tajwid',
    level: 'Lanjutan',
    page: '1-10',
    description: 'Membaca nun mati/tanwin dengan jelas tanpa dengung saat bertemu 6 huruf tenggorokan.',
    content: 'Kaidah Pokok:\n• Huruf Idzhar: Hamzah, Ha, \'Ain, Haa, Ghain, Kha (Contoh: man aamana, min khairin, an\'amta).\n• Pelafalan jelas 100% tanpa diputus atau diseret.',
    targetCompetence: 'Pelafalan jelas 100% tanpa diputus atau diseret saat membaca ayat-ayat Al-Qur\'an.'
  },
  {
    id: 'mat-tajwid-2',
    title: 'Hukum Mad: Mad Wajib Muttashil & Mad Jaiz Munfashil',
    name: 'Hukum Mad: Mad Wajib Muttashil & Mad Jaiz Munfashil',
    category: 'Tajwid',
    jilid: 'Tajwid',
    level: 'Lanjutan',
    page: '11-20',
    description: 'Kaidah panjang 4-5 harakat pada mad bertemu hamzah dalam satu kata (Muttashil) atau lain kata (Munfashil).',
    content: 'Kaidah Pokok:\n• Mad Wajib Muttashil: Huruf mad bertemu hamzah dalam 1 kata (wajib 4-5 harakat). Contoh: جَآءَ - سُوْٓءَ\n• Mad Jaiz Munfashil: Huruf mad bertemu hamzah di awal kata berikutnya (boleh 4-5 harakat). Contoh: يَآاَيُّهَا - بِمَآ اُنْزِلَ',
    targetCompetence: 'Konsisten membaca durasi mad 4-5 harakat pada seluruh mushaf Al-Qur\'an.'
  },
  {
    id: 'mat-tahsin-1',
    title: 'Makharijul Huruf: Al-Halq (Tenggorokan)',
    name: 'Makharijul Huruf: Al-Halq (Tenggorokan)',
    category: 'Tahsin',
    level: 'Dasar',
    page: '1-15',
    description: 'Tempat keluarnya huruf dari tenggorokan bawah, tengah, dan atas.',
    content: 'Kaidah Pokok:\n• Aqshal Halq (Pangkal Tenggorokan): Hamzah (ء) & Ha besar (هـ).\n• Wasathal Halq (Tengah Tenggorokan): \'Ain (ع) & Haa kecil (ح).\n• Adnal Halq (Ujung Tenggorokan): Ghain (غ) & Kha (خ).',
    targetCompetence: 'Mampu membedakan artikulasi \'Ain dan Hamzah serta Haa dan Ha besar secara fasih.'
  }
];
