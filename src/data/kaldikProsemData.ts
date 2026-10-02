export type KaldikCellStyle = 'normal' | 'sunday_red' | 'holiday_text_red' | 'invalid_black';

export interface KaldikCell {
  text: string;
  style?: KaldikCellStyle;
}

export interface KaldikMonthRow {
  id: string;
  monthName: string;
  days: Record<number, KaldikCell>; // 1..31
}

export interface KaldikLegendItem {
  id: string;
  code: string;
  description: string;
  column: 'left' | 'right';
}

export interface KaldikEffectiveMonth {
  monthName: string;
  weeks: [number | null, number | null, number | null, number | null, number | null];
  jamWeeks?: [number | null, number | null, number | null, number | null, number | null];
}

export interface KaldikData {
  title: string;
  schoolName: string;
  academicYear: string;
  semesterLabel: string;
  months: KaldikMonthRow[];
  legends: KaldikLegendItem[];
  signPlaceDate: string;
  signRoleTitle: string;
  signCoordinatorName: string;
  semester1Effective: KaldikEffectiveMonth[];
  semester2Effective: KaldikEffectiveMonth[];
  updatedAt?: string;
}

export interface ProsemRow {
  id: string;
  no: number;
  jilid: string;
  hlmPeraga: string;
  hlmBuku: string;
  targetHafalanSurat: string;
  drillHafalanSurat: string;
  tm: number | string;
  // key format: `${monthIndex}_${weekIndex}` where monthIndex is 0..5 and weekIndex is 1..5
  weekValues: Record<string, string | number>;
  keterangan: string;
}

export interface ProsemSheet {
  id: string;
  semester: 'Semester I' | 'Semester II';
  jilidLabel: string;
  title: string;
  lembaga: string;
  halaqahId?: string;
  halaqahName?: string;
  musyrifId?: string;
  musyrifName?: string;
  monthNames: [string, string, string, string, string, string];
  // key format: `${monthIndex}_${weekIndex}` (0..5, 1..5)
  headerTatapMuka: Record<string, string | number>;
  headerTatapMukaHighlighted: Record<string, boolean>;
  rows: ProsemRow[];
  ujianKenaikanJilidTM: string | number;
  ujianKenaikanJilidWeeks: Record<string, string | number>;
  ujianKenaikanJilidKeterangan: string;
  totalPertemuanOverride?: string | number;
  signPlaceDate: string;
  signRoleTitle: string;
  signCoordinatorName: string;
  signMusyrifTitle?: string;
  signMusyrifName?: string;
  updatedAt?: string;
}

// Helper to build a month's 31 days cleanly
function createMonthDays(
  entries: Record<number, string | { text: string; style: KaldikCellStyle }>,
  redBgDays: number[] = [],
  blackBgDays: number[] = [],
  redTextDays: number[] = []
): Record<number, KaldikCell> {
  const map: Record<number, KaldikCell> = {};
  for (let d = 1; d <= 31; d++) {
    const raw = entries[d];
    let text = '';
    let style: KaldikCellStyle = 'normal';

    if (typeof raw === 'string') {
      text = raw;
    } else if (raw && typeof raw === 'object') {
      text = raw.text;
      style = raw.style;
    }

    if (blackBgDays.includes(d)) {
      style = 'invalid_black';
    } else if (redBgDays.includes(d)) {
      style = 'sunday_red';
    } else if (redTextDays.includes(d)) {
      style = 'holiday_text_red';
    }

    map[d] = { text, style };
  }
  return map;
}

export const INITIAL_KALDIK_DATA: KaldikData = {
  title: "KALENDER PENDIDIKAN AL QUR'AN METODE UMMI",
  schoolName: 'SMP ISLAM AL AZHAR 21 SOLO BARU',
  academicYear: 'Tahun Ajaran 2026/2027',
  semesterLabel: 'Semester: 1 & 2',
  months: [
    {
      id: 'm-juli',
      monthName: 'Juli',
      days: createMonthDays(
        {
          1: 'LS', 2: 'LS', 3: 'LS', 6: 'LS',
          7: 'MOM', 8: 'MOM', 9: 'MOM',
          13: 'MPLS', 14: 'MPLS', 15: 'MPLS', 16: 'MPLS', 17: 'MPLS',
          20: '1', 21: '2', 22: '3', 23: '4', 24: '5',
          27: '6', 28: '7', 29: '8', 30: '9', 31: '10'
        },
        [5, 12, 19, 26]
      )
    },
    {
      id: 'm-agustus',
      monthName: 'Agustus',
      days: createMonthDays(
        {
          3: '11', 4: '12', 5: '13', 6: '14', 7: '15',
          10: '16', 11: '17', 12: '18', 13: '19', 14: '20',
          17: 'LU', 18: '21', 19: '22', 20: '23', 21: '24',
          24: '25', 25: 'LU', 26: '26', 27: '27', 28: '28',
          31: '29'
        },
        [2, 9, 16, 23, 30],
        [],
        [17, 25]
      )
    },
    {
      id: 'm-september',
      monthName: 'September',
      days: createMonthDays(
        {
          1: '30', 2: '31', 3: '32', 4: '33',
          7: '34', 8: '35', 9: '36', 10: '37', 11: '38',
          14: '39', 15: '40', 16: '41', 17: '42', 18: '43',
          21: 'ASTS', 22: 'ASTS', 23: 'ASTS', 24: 'ASTS', 25: 'ASTS',
          28: 'ASTS', 29: 'ASTS', 30: 'ASTS'
        },
        [6, 13, 20, 27],
        [31]
      )
    },
    {
      id: 'm-oktober',
      monthName: 'Oktober',
      days: createMonthDays(
        {
          1: '44', 2: '45',
          5: '46', 6: '47', 7: '48', 8: '49', 9: 'BLP',
          12: '50', 13: '51', 14: '52', 15: '53', 16: '54',
          19: '55', 20: '56', 21: '57', 22: '58', 23: '59',
          26: '60', 27: '61', 28: '62', 29: '63', 30: '64'
        },
        [4, 11, 18, 25]
      )
    },
    {
      id: 'm-november',
      monthName: 'November',
      days: createMonthDays(
        {
          2: '65', 3: '66', 4: '67', 5: '68', 6: '69',
          9: '70', 10: '71', 11: '72', 12: '73', 13: '74',
          16: '75', 17: '76', 18: '77', 19: '78', 20: '79',
          23: '80', 24: '81', 25: '82', 26: '83', 27: '84',
          30: 'ASAS'
        },
        [1, 8, 15, 22, 29],
        [31]
      )
    },
    {
      id: 'm-desember',
      monthName: 'Desember',
      days: createMonthDays(
        {
          1: 'ASAS', 2: 'ASAS', 3: 'ASAS', 4: 'ASAS',
          7: 'ASAS', 8: 'ASAS', 9: 'PUS', 10: 'PUS', 11: 'PUS',
          14: 'PUS', 15: 'PUS', 16: 'PUS', 17: 'PUS', 18: 'BLP',
          21: 'LS', 22: 'LS', 23: 'LS', 24: 'LS', 25: 'LS',
          28: 'LS', 29: 'LS', 30: 'LS', 31: 'LS'
        },
        [6, 13, 20, 27],
        [],
        [21, 22, 23, 24, 25, 28, 29, 30, 31]
      )
    },
    {
      id: 'm-januari',
      monthName: 'Januari',
      days: createMonthDays(
        {
          1: 'LS', 4: 'EF', 5: 'LU', 6: '1', 7: '2', 8: '3',
          11: '4', 12: '5', 13: '6', 14: '7', 15: '8',
          18: '9', 19: '10', 20: '11', 21: '12', 22: '13',
          25: '14', 26: '15', 27: '16', 28: '17', 29: '18'
        },
        [3, 10, 17, 24, 31],
        [],
        [1, 5]
      )
    },
    {
      id: 'm-februari',
      monthName: 'Februari',
      days: createMonthDays(
        {
          1: '19', 2: '20', 3: '21', 4: '22', 5: '23',
          8: 'LPP', 9: 'LPP', 10: 'LPP', 11: 'EF', 12: 'EF',
          15: '24', 16: '25', 17: '26', 18: '27',
          22: '28', 23: '29', 24: 'EF', 25: 'EF', 26: 'LR'
        },
        [7, 14, 21, 28],
        [29, 30, 31],
        [8, 9, 10]
      )
    },
    {
      id: 'm-maret',
      monthName: 'Maret 2027',
      days: createMonthDays(
        {
          1: 'LR', 2: 'LR', 3: 'LR', 4: 'LR', 5: 'LR',
          8: 'LR', 9: 'LR', 10: 'LR', 11: 'LR', 12: 'LR',
          15: 'LR', 16: 'LR', 17: 'EF', 18: 'ASTS', 19: 'ASTS',
          22: 'ASTS', 23: 'ASTS', 24: 'ASTS', 25: 'ASTS', 26: 'EF',
          29: '30', 30: '31', 31: '32'
        },
        [7, 14, 21, 28],
        [],
        [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16]
      )
    },
    {
      id: 'm-april',
      monthName: 'April 2027',
      days: createMonthDays(
        {
          1: 'PUS', 2: 'BLP',
          5: '33', 6: '34', 7: '35', 8: '36', 9: '37',
          12: '38', 13: '39', 14: '40', 15: '41', 16: '42',
          19: '43', 20: '44', 21: '45', 22: '46', 23: '47',
          26: '48', 27: '49', 28: '50', 29: '51', 30: '52'
        },
        [4, 11, 18, 25]
      )
    },
    {
      id: 'm-mei',
      monthName: 'Mei 2027',
      days: createMonthDays(
        {
          3: 'ASAJ', 4: 'ASAJ', 5: 'ASAJ', 6: 'LU', 7: 'ASAJ',
          10: 'ASAJ', 11: 'ASAJ', 12: 'ASAJ', 13: '53', 14: '54',
          17: '55', 18: '56', 19: '57', 20: 'LU', 21: '58',
          24: '59', 25: '60', 26: '61', 27: '62', 28: '63'
        },
        [2, 9, 16, 23, 30],
        [],
        [6, 20]
      )
    },
    {
      id: 'm-juni',
      monthName: 'Juni 2027',
      days: createMonthDays(
        {
          1: 'LU', 2: 'ASAS', 3: 'ASAS', 4: 'ASAS',
          6: 'LU', 7: 'ASAS', 8: 'ASAS', 9: 'ASAS', 10: 'ASAS', 11: 'PUS',
          14: 'PUS', 15: 'PUS', 16: 'PUS', 17: 'PUS', 18: 'BLP',
          21: 'LS', 22: 'LS', 23: 'LS', 24: 'LS', 25: 'LS',
          28: 'LS', 29: 'LS', 30: 'LS', 31: 'LS'
        },
        [6, 13, 20, 27],
        [],
        [1, 21, 22, 23, 24, 25, 28, 29, 30, 31]
      )
    }
  ],
  legends: [
    { id: 'leg-1', code: 'LU', description: 'Libur umum', column: 'left' },
    { id: 'leg-2', code: 'HP', description: 'Hari permulaan sekolah', column: 'left' },
    { id: 'leg-3', code: 'OQ', description: "Orientasi Al-Qur'an", column: 'left' },
    { id: 'leg-4', code: 'LHB', description: 'Libur hari besar', column: 'left' },
    { id: 'leg-5', code: 'LPP', description: 'Libur permulaan puasa', column: 'left' },
    { id: 'leg-6', code: 'LHR', description: 'Libur hari raya', column: 'left' },
    { id: 'leg-7', code: 'LS', description: 'Libur semester', column: 'left' },
    { id: 'leg-8', code: 'EF', description: 'Efektif Fakultatif', column: 'left' },
    { id: 'leg-9', code: 'UNJ', description: 'Ujian Kenaikan Jilid', column: 'left' },
    { id: 'leg-10', code: 'UAS', description: 'Ujian akhir semester', column: 'right' },
    { id: 'leg-11', code: 'UTSQ', description: "Ujian tengah semester Al-Qur'an", column: 'right' },
    { id: 'leg-12', code: 'UASQ', description: "Ujian akhir semester Al-Qur'an", column: 'right' },
    { id: 'leg-13', code: 'PUS', description: 'Pasca ujian semester', column: 'right' },
    { id: 'leg-14', code: 'PR', description: 'Penerimaan raport', column: 'right' },
    { id: 'leg-15', code: 'PM', description: 'Pra Munaqosyah', column: 'right' },
    { id: 'leg-16', code: 'MQ', description: 'Munaqosyah', column: 'right' },
    { id: 'leg-17', code: 'HI', description: "Khotmil Qur'an & Imtihan", column: 'right' }
  ],
  signPlaceDate: 'Sukoharjo, 14 Juni 2026',
  signRoleTitle: "Koordinator Al Qur'an",
  signCoordinatorName: '(Muh. Yusrie Alfian, S.Ag)',
  semester1Effective: [
    { monthName: 'JULI', weeks: [null, null, null, 5, 5], jamWeeks: [null, null, null, 8, 8] },
    { monthName: 'Agustus', weeks: [5, 5, 4, 4, 1], jamWeeks: [8, 8, 6, 6, null] },
    { monthName: 'September', weeks: [4, 5, 5, null, null], jamWeeks: [6, 8, 8, null, null] },
    { monthName: 'Oktober', weeks: [2, 4, 5, 5, 5], jamWeeks: [null, 6, 8, 8, 8] },
    { monthName: 'Nopember', weeks: [5, 5, 5, 4, null], jamWeeks: [8, 8, 8, 6, null] },
    { monthName: 'Desember', weeks: [null, null, null, null, null], jamWeeks: [null, null, null, null, null] }
  ],
  semester2Effective: [
    { monthName: 'Januari', weeks: [null, 3, 5, 5, 5] },
    { monthName: 'Februari', weeks: [5, 4, 2, null, null] },
    { monthName: 'Maret', weeks: [null, null, null, 3, null] },
    { monthName: 'April', weeks: [5, 5, 5, 5, null] },
    { monthName: 'Mei', weeks: [null, 2, 4, 5, null] },
    { monthName: 'Juni', weeks: [null, null, null, null, null] }
  ]
};

export const INITIAL_PROSEM_SHEETS: ProsemSheet[] = [
  {
    id: 'prosem-sem1-jilid1',
    semester: 'Semester I',
    jilidLabel: 'Jilid 1',
    title: "PROGRAM SEMESTER I PEMBELAJARAN AL QUR'AN METODE UMMI",
    lembaga: 'SMP ISLAM AL AZHAR 21 SOLO BARU',
    halaqahId: 'hlq-1',
    halaqahName: 'Halaqah 1 (Umar bin Khattab)',
    musyrifId: 't-1',
    musyrifName: 'Ustadz Ahmad Fauzan, Lc.',
    monthNames: ['Juli', 'Agustus', 'September', 'Oktober', 'Nopember', 'Desember'],
    headerTatapMuka: {
      '0_4': 2,
      '0_5': 2,
      '1_1': 2,
      '1_2': 1,
      '1_3': 2,
      '1_4': 1,
      '2_1': 2,
      '2_2': 2,
      '2_3': 2,
      '3_2': 2,
      '3_3': 2,
      '3_4': 2,
      '3_5': 2,
      '4_1': 2,
      '4_2': 2,
      '4_3': 2,
      '4_4': 2
    },
    headerTatapMukaHighlighted: {
      '0_3': true, '0_4': true, '0_5': true,
      '1_1': true, '1_2': true, '1_3': true, '1_4': true,
      '2_1': true, '2_2': true, '2_3': true, '2_4': true, '2_5': true,
      '3_1': true, '3_2': true, '3_3': true, '3_4': true, '3_5': true,
      '4_1': true, '4_2': true, '4_3': true, '4_4': true, '4_5': true,
      '5_1': true, '5_2': true, '5_3': true
    },
    rows: [
      {
        id: 'pr-1',
        no: 1,
        jilid: '',
        hlmPeraga: 'Orientasi',
        hlmBuku: '',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: {},
        keterangan: ''
      },
      {
        id: 'pr-2',
        no: 2,
        jilid: '1',
        hlmPeraga: '1-2',
        hlmBuku: '1-2',
        targetHafalanSurat: 'An-Nass 1-2',
        drillHafalanSurat: 'An-Nass 1-2',
        tm: 2,
        weekValues: { '0_4': 2 },
        keterangan: ''
      },
      {
        id: 'pr-3',
        no: 3,
        jilid: '1',
        hlmPeraga: '3-4',
        hlmBuku: '3-4',
        targetHafalanSurat: 'An-Nass 3-4',
        drillHafalanSurat: 'An-Nass 3-4',
        tm: 2,
        weekValues: { '0_5': 2 },
        keterangan: ''
      },
      {
        id: 'pr-4',
        no: 4,
        jilid: '1',
        hlmPeraga: '5-6',
        hlmBuku: '5-6',
        targetHafalanSurat: 'An-Nass 5-6',
        drillHafalanSurat: 'An-Nas 1-6',
        tm: 2,
        weekValues: { '1_1': 2 },
        keterangan: ''
      },
      {
        id: 'pr-5',
        no: 5,
        jilid: '1',
        hlmPeraga: '7-8',
        hlmBuku: '7-8',
        targetHafalanSurat: 'Al-Falaq 1-2',
        drillHafalanSurat: 'Al-Falaq 1-2',
        tm: 2,
        weekValues: { '1_2': 1 },
        keterangan: ''
      },
      {
        id: 'pr-6',
        no: 6,
        jilid: '1',
        hlmPeraga: '9-11',
        hlmBuku: '9-10',
        targetHafalanSurat: 'Al-Falaq 3-5',
        drillHafalanSurat: 'Al-Falaq 1-5',
        tm: 2,
        weekValues: { '1_3': 2 },
        keterangan: ''
      },
      {
        id: 'pr-7',
        no: 7,
        jilid: '1',
        hlmPeraga: '12',
        hlmBuku: '11',
        targetHafalanSurat: 'Al-Ikhlas 1-2',
        drillHafalanSurat: 'Al-Ikhlas 1-2',
        tm: 2,
        weekValues: { '1_4': 1 },
        keterangan: ''
      },
      {
        id: 'pr-8',
        no: 8,
        jilid: '1',
        hlmPeraga: '13',
        hlmBuku: '12-13',
        targetHafalanSurat: 'Al-Ikhlas 3-4',
        drillHafalanSurat: 'Al-Ikhlas 1-4',
        tm: 2,
        weekValues: { '2_1': 2 },
        keterangan: ''
      },
      {
        id: 'pr-9',
        no: 9,
        jilid: '1',
        hlmPeraga: '14-16',
        hlmBuku: '14-15',
        targetHafalanSurat: 'Al-Lahab 1-2',
        drillHafalanSurat: 'Al-Lahab 1-2',
        tm: 2,
        weekValues: { '2_2': 2 },
        keterangan: ''
      },
      {
        id: 'pr-10',
        no: 10,
        jilid: '1',
        hlmPeraga: '17-18',
        hlmBuku: '16-17',
        targetHafalanSurat: 'Al-Lahab 3-5',
        drillHafalanSurat: 'Al-Lahab 1-5',
        tm: 2,
        weekValues: { '2_3': 2 },
        keterangan: ''
      },
      {
        id: 'pr-11',
        no: 11,
        jilid: '1',
        hlmPeraga: '19-20',
        hlmBuku: '18-20',
        targetHafalanSurat: 'An-Nashr 1-3',
        drillHafalanSurat: 'An-Nashr 1-3',
        tm: 2,
        weekValues: { '3_2': 2 },
        keterangan: ''
      },
      {
        id: 'pr-12',
        no: 12,
        jilid: '1',
        hlmPeraga: '1-2',
        hlmBuku: '21-22',
        targetHafalanSurat: 'Al-Kafirun 1-2',
        drillHafalanSurat: 'Al-Kafirun 1-2',
        tm: 2,
        weekValues: { '3_3': 2 },
        keterangan: ''
      },
      {
        id: 'pr-13',
        no: 13,
        jilid: '1',
        hlmPeraga: '3-4',
        hlmBuku: '23-24',
        targetHafalanSurat: 'Al-Kafirun 3-4',
        drillHafalanSurat: 'Al-Kafirun 3-4',
        tm: 2,
        weekValues: { '3_4': 2 },
        keterangan: ''
      },
      {
        id: 'pr-14',
        no: 14,
        jilid: '1',
        hlmPeraga: '5-7',
        hlmBuku: '25-27',
        targetHafalanSurat: 'Al-Kafirun 5-6',
        drillHafalanSurat: 'Al-Kafirun 1-6',
        tm: 2,
        weekValues: { '3_5': 2 },
        keterangan: ''
      },
      {
        id: 'pr-15',
        no: 15,
        jilid: '1',
        hlmPeraga: '8-10',
        hlmBuku: '28-30',
        targetHafalanSurat: 'Al-Kautsar 1-3',
        drillHafalanSurat: '',
        tm: '',
        weekValues: { '4_1': 2 },
        keterangan: ''
      },
      {
        id: 'pr-16',
        no: 16,
        jilid: '1',
        hlmPeraga: '11-12',
        hlmBuku: '31-32',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: { '4_2': 2 },
        keterangan: ''
      },
      {
        id: 'pr-17',
        no: 17,
        jilid: '1',
        hlmPeraga: '13-14',
        hlmBuku: '33-34',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: { '4_3': 2 },
        keterangan: ''
      },
      {
        id: 'pr-18',
        no: 18,
        jilid: '1',
        hlmPeraga: '15-17',
        hlmBuku: '35-37',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: { '4_4': 2 },
        keterangan: ''
      },
      {
        id: 'pr-19',
        no: 19,
        jilid: '1',
        hlmPeraga: '18-20',
        hlmBuku: '38-40',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: { '4_5': 2 },
        keterangan: ''
      },
      {
        id: 'pr-20',
        no: 20,
        jilid: '1',
        hlmPeraga: '',
        hlmBuku: '',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: {},
        keterangan: ''
      },
      {
        id: 'pr-21',
        no: 21,
        jilid: '1',
        hlmPeraga: '',
        hlmBuku: '',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: {},
        keterangan: ''
      },
      {
        id: 'pr-22',
        no: 22,
        jilid: '1',
        hlmPeraga: '',
        hlmBuku: '',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: '',
        weekValues: {},
        keterangan: ''
      }
    ],
    ujianKenaikanJilidTM: '',
    ujianKenaikanJilidWeeks: {},
    ujianKenaikanJilidKeterangan: '',
    totalPertemuanOverride: 26,
    signPlaceDate: 'Sukoharjo, 14 Juli 2026',
    signRoleTitle: "Koordinator Al Qur'an",
    signCoordinatorName: '(Muh. Yusrie Alfian, S.Ag)',
    signMusyrifTitle: 'Guru / Musyrif Halaqah',
    signMusyrifName: '(Ustadz Ahmad Fauzan, Lc.)'
  },
  {
    id: 'prosem-sem1-jilid2-hlq2',
    semester: 'Semester I',
    jilidLabel: 'Jilid 2',
    title: "PROGRAM SEMESTER I PEMBELAJARAN AL QUR'AN METODE UMMI",
    lembaga: 'SMP ISLAM AL AZHAR 21 SOLO BARU',
    halaqahId: 'hlq-2',
    halaqahName: 'Halaqah 2 (Abu Bakar)',
    musyrifId: 't-2',
    musyrifName: 'Ustadz Ridwan Kamil, S.Pd.I',
    monthNames: ['Juli', 'Agustus', 'September', 'Oktober', 'Nopember', 'Desember'],
    headerTatapMuka: {
      '0_4': 2, '0_5': 2,
      '1_1': 2, '1_2': 1, '1_3': 2, '1_4': 1,
      '2_1': 2, '2_2': 2, '2_3': 2,
      '3_2': 2, '3_3': 2, '3_4': 2, '3_5': 2,
      '4_1': 2, '4_2': 2, '4_3': 2, '4_4': 2
    },
    headerTatapMukaHighlighted: {
      '0_4': true, '0_5': true,
      '1_1': true, '1_2': true, '1_3': true, '1_4': true,
      '2_1': true, '2_2': true, '2_3': true,
      '3_2': true, '3_3': true, '3_4': true, '3_5': true,
      '4_1': true, '4_2': true, '4_3': true, '4_4': true
    },
    rows: Array.from({ length: 18 }, (_, i) => ({
      id: `pr-s1-h2-${i + 1}`,
      no: i + 1,
      jilid: i === 0 ? '' : '2',
      hlmPeraga: i === 0 ? 'Orientasi Semester I' : `${(i - 1) * 2 + 1}-${i * 2}`,
      hlmBuku: i === 0 ? '' : `${(i - 1) * 2 + 1}-${i * 2}`,
      targetHafalanSurat: i === 1 ? 'Al-Humazah 1-4' : i === 2 ? 'Al-Humazah 5-9' : i === 3 ? 'Al-Ashr 1-3' : i === 4 ? 'At-Takatsur 1-4' : '',
      drillHafalanSurat: i === 1 ? 'Al-Humazah 1-4' : i === 2 ? 'Al-Humazah 1-9' : i === 3 ? 'Al-Ashr 1-3' : i === 4 ? 'At-Takatsur 1-8' : '',
      tm: i === 0 ? '' : 2,
      weekValues: i === 1 ? { '0_4': 2 } : i === 2 ? { '0_5': 2 } : {},
      keterangan: ''
    })),
    ujianKenaikanJilidTM: '',
    ujianKenaikanJilidWeeks: {},
    ujianKenaikanJilidKeterangan: '',
    totalPertemuanOverride: 26,
    signPlaceDate: 'Sukoharjo, 14 Juli 2026',
    signRoleTitle: "Koordinator Al Qur'an",
    signCoordinatorName: '(Muh. Yusrie Alfian, S.Ag)',
    signMusyrifTitle: 'Guru / Musyrif Halaqah',
    signMusyrifName: '(Ustadz Ridwan Kamil, S.Pd.I)'
  },
  {
    id: 'prosem-sem2-jilid2',
    semester: 'Semester II',
    jilidLabel: 'Jilid 2',
    title: "PROGRAM SEMESTER II PEMBELAJARAN AL QUR'AN METODE UMMI",
    lembaga: 'SMP ISLAM AL AZHAR 21 SOLO BARU',
    halaqahId: 'hlq-1',
    halaqahName: 'Halaqah 1 (Umar bin Khattab)',
    musyrifId: 't-1',
    musyrifName: 'Ustadz Ahmad Fauzan, Lc.',
    monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'],
    headerTatapMuka: {
      '0_2': 2, '0_3': 2, '0_4': 2, '0_5': 2,
      '1_1': 2, '1_2': 2, '1_3': 1,
      '2_4': 1,
      '3_1': 2, '3_2': 2, '3_3': 2, '3_4': 2,
      '4_2': 1, '4_3': 2, '4_4': 2
    },
    headerTatapMukaHighlighted: {
      '0_2': true, '0_3': true, '0_4': true, '0_5': true,
      '1_1': true, '1_2': true, '1_3': true,
      '2_4': true,
      '3_1': true, '3_2': true, '3_3': true, '3_4': true,
      '4_2': true, '4_3': true, '4_4': true
    },
    rows: Array.from({ length: 20 }, (_, i) => ({
      id: `pr-s2-${i + 1}`,
      no: i + 1,
      jilid: i === 0 ? '' : '2',
      hlmPeraga: i === 0 ? 'Orientasi Semester II' : `${(i - 1) * 2 + 1}-${i * 2}`,
      hlmBuku: i === 0 ? '' : `${(i - 1) * 2 + 1}-${i * 2}`,
      targetHafalanSurat: i === 1 ? 'Al-Ma\'un 1-3' : i === 2 ? 'Al-Ma\'un 4-7' : i === 3 ? 'Quraisy 1-4' : i === 4 ? 'Al-Fil 1-5' : '',
      drillHafalanSurat: i === 1 ? 'Al-Ma\'un 1-3' : i === 2 ? 'Al-Ma\'un 1-7' : i === 3 ? 'Quraisy 1-4' : i === 4 ? 'Al-Fil 1-5' : '',
      tm: i === 0 ? '' : 2,
      weekValues: {},
      keterangan: ''
    })),
    ujianKenaikanJilidTM: '',
    ujianKenaikanJilidWeeks: {},
    ujianKenaikanJilidKeterangan: '',
    totalPertemuanOverride: 25,
    signPlaceDate: 'Sukoharjo, 05 Januari 2027',
    signRoleTitle: "Koordinator Al Qur'an",
    signCoordinatorName: '(Muh. Yusrie Alfian, S.Ag)',
    signMusyrifTitle: 'Guru / Musyrif Halaqah',
    signMusyrifName: '(Ustadz Ahmad Fauzan, Lc.)'
  },
  {
    id: 'prosem-sem1-jilid3-hlq3',
    semester: 'Semester I',
    jilidLabel: 'Jilid 3',
    title: "PROGRAM SEMESTER I PEMBELAJARAN AL QUR'AN METODE UMMI",
    lembaga: 'SMP ISLAM AL AZHAR 21 SOLO BARU',
    halaqahId: 'hlq-3',
    halaqahName: 'Halaqah 3 (Ali bin Abi Thalib)',
    musyrifId: 't-3',
    musyrifName: 'Ustadzah Siti Aminah, S.Th.I',
    monthNames: ['Juli', 'Agustus', 'September', 'Oktober', 'Nopember', 'Desember'],
    headerTatapMuka: {
      '0_4': 2, '0_5': 2,
      '1_1': 2, '1_2': 1, '1_3': 2, '1_4': 1,
      '2_1': 2, '2_2': 2, '2_3': 2,
      '3_2': 2, '3_3': 2, '3_4': 2, '3_5': 2,
      '4_1': 2, '4_2': 2, '4_3': 2, '4_4': 2
    },
    headerTatapMukaHighlighted: {
      '0_4': true, '0_5': true,
      '1_1': true, '1_2': true, '1_3': true, '1_4': true,
      '2_1': true, '2_2': true, '2_3': true,
      '3_2': true, '3_3': true, '3_4': true, '3_5': true,
      '4_1': true, '4_2': true, '4_3': true, '4_4': true
    },
    rows: Array.from({ length: 16 }, (_, i) => ({
      id: `pr-s1-h3-${i + 1}`,
      no: i + 1,
      jilid: i === 0 ? '' : '3',
      hlmPeraga: i === 0 ? 'Orientasi Semester I' : `${(i - 1) * 2 + 1}-${i * 2}`,
      hlmBuku: i === 0 ? '' : `${(i - 1) * 2 + 1}-${i * 2}`,
      targetHafalanSurat: i === 1 ? 'Al-Qari\'ah 1-5' : i === 2 ? 'Al-Qari\'ah 6-11' : i === 3 ? 'Al-\'Adiyat 1-5' : i === 4 ? 'Al-\'Adiyat 6-11' : '',
      drillHafalanSurat: i === 1 ? 'Al-Qari\'ah 1-5' : i === 2 ? 'Al-Qari\'ah 1-11' : i === 3 ? 'Al-\'Adiyat 1-5' : i === 4 ? 'Al-\'Adiyat 1-11' : '',
      tm: i === 0 ? '' : 2,
      weekValues: {},
      keterangan: ''
    })),
    ujianKenaikanJilidTM: '',
    ujianKenaikanJilidWeeks: {},
    ujianKenaikanJilidKeterangan: '',
    totalPertemuanOverride: 26,
    signPlaceDate: 'Sukoharjo, 14 Juli 2026',
    signRoleTitle: "Koordinator Al Qur'an",
    signCoordinatorName: '(Muh. Yusrie Alfian, S.Ag)',
    signMusyrifTitle: 'Guru / Musyrifah Halaqah',
    signMusyrifName: '(Ustadzah Siti Aminah, S.Th.I)'
  }
];
