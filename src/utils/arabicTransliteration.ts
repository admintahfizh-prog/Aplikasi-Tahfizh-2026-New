// Utility to transliterate Indonesian / Islamic student names into standard Arabic script
// Supports common Islamic names, Indonesian phonetic mapping, and custom overrides.

const KNOWN_NAME_MAPPINGS: Record<string, string> = {
  // Islamic Names
  'muhammad': 'مُحَمَّد',
  'mohammad': 'مُحَمَّد',
  'mochammad': 'مُحَمَّد',
  'muhamad': 'مُحَمَّد',
  'ahmad': 'أَحْمَد',
  'achmad': 'أَحْمَد',
  'ali': 'عَلِيّ',
  'umar': 'عُمَر',
  'utsman': 'عُثْمَان',
  'usman': 'عُثْمَان',
  'abu': 'أَبُو',
  'bakar': 'بَكْر',
  'abubakar': 'أَبُو بَكْر',
  'hasan': 'حَسَن',
  'hassan': 'حَسَّان',
  'husain': 'حُسَيْن',
  'husein': 'حُسَيْن',
  'ibrahim': 'إِبْرَاهِيم',
  'ismail': 'إِسْمَاعِيل',
  'ishaq': 'إِسْحَاق',
  'yaqub': 'يَعْقُوب',
  'yusuf': 'يُوسُف',
  'yunus': 'يُونُس',
  'idris': 'إِدْرِيس',
  'hud': 'هُود',
  'sholeh': 'صَالِح',
  'saleh': 'صَالِح',
  'ayub': 'أَيُّوب',
  'harun': 'هَارُون',
  'musa': 'مُوسَى',
  'daud': 'دَاوُد',
  'sulaiman': 'سُلَيْمَان',
  'ilyas': 'إِلْيَاس',
  'zakariya': 'زَكَرِيَّا',
  'yahya': 'يَحْيَى',
  'isa': 'عِيسَى',
  'aisyah': 'عَائِشَة',
  'aishah': 'عَائِشَة',
  'fatimah': 'فَاطِمَة',
  'khadijah': 'خَدِيجَة',
  'maryam': 'مَرْيَم',
  'zainab': 'زَيْنَب',
  'ruqayyah': 'رُقَيَّة',
  'ummu': 'أُمّ',
  'kalsum': 'كُلْثُوم',
  'hafshah': 'حَفْصَة',
  'hafsa': 'حَفْصَة',
  'saudah': 'سَوْدَة',
  'shafiyyah': 'صَفِيَّة',
  'maimunah': 'مَيْمُونَة',
  'juwairiyah': 'جُوَيْرِيَة',
  'asma': 'أَسْمَاء',
  'zahra': 'زَهْرَاء',
  'zahrah': 'زَهْرَة',
  'nabil': 'نَبِيل',
  'nabila': 'نَبِيلَة',
  'nabilah': 'نَبِيلَة',
  'fauzan': 'فَوْزَان',
  'fauzi': 'فَوْزِي',
  'fauziah': 'فَوْزِيَّة',
  'rizki': 'رِزْقِي',
  'rizky': 'رِزْقِي',
  'rizqi': 'رِزْقِي',
  'rifqi': 'رِفْقِي',
  'rifki': 'رِفْقِي',
  'farhan': 'فَرْحَان',
  'farah': 'فَرَح',
  'fathir': 'فَاطِر',
  'fatih': 'فَاتِح',
  'al-fatih': 'الفَاتِح',
  'alfatih': 'الفَاتِح',
  'hamzah': 'حَمْزَة',
  'bilal': 'بِلَال',
  'thariq': 'طَارِق',
  'tariq': 'طَارِق',
  'haidar': 'حَيْدَر',
  'hadi': 'هَادِي',
  'nur': 'نُور',
  'noor': 'نُور',
  'cahya': 'نُور',
  'hidayat': 'هِدَايَة',
  'hidayatullah': 'هِدَايَةُ الله',
  'abdullah': 'عَبْدُ الله',
  'abdul': 'عَبْدُ ال',
  'abdurrahman': 'عَبْدُ الرَّحْمَنِ',
  'abdurrahim': 'عَبْدُ الرَّحِيمِ',
  'abdulloh': 'عَبْدُ الله',
  'aziz': 'عَزِيز',
  'hakim': 'حَكِيم',
  'karim': 'كَرِيم',
  'malik': 'مَالِك',
  'latif': 'لَطِيف',
  'syakir': 'شَاكِر',
  'syakira': 'شَاكِرَة',
  'syifa': 'شِفَاء',
  'salma': 'سَلْمَى',
  'salman': 'سَلْمَان',
  'akbar': 'أَكْبَر',
  'anwar': 'أَنْوَر',
  'azhar': 'أَزْهَر',
  'ihsan': 'إِحْسَان',
  'ikhsan': 'إِحْسَان',
  'ikram': 'إِكْرَام',
  'iman': 'إِيمَان',
  'irfan': 'عِرْفَان',
  'luqman': 'لُقْمَان',
  'lukman': 'لُقْمَان',
  'muaz': 'مُعَاذ',
  'muadz': 'مُعَاذ',
  'najwa': 'نَجْوَى',
  'nada': 'نَدَى',
  'raihan': 'رَيْحَان',
  'rayhan': 'رَيْحَان',
  'raihana': 'رَيْحَانَة',
  'ridho': 'رِضَا',
  'ridwan': 'رِضْوَان',
  'rizal': 'رِجَال',
  'saad': 'سَعْد',
  'said': 'سَعِيد',
  'syafiq': 'شَفِيق',
  'syamil': 'شَامِل',
  'taufiq': 'تَوْفِيق',
  'wahid': 'وَاحِد',
  'wafi': 'وَافِي',
  'yasir': 'يَاسِر',
  'zain': 'زَيْن',
  'ziyad': 'زِيَاد',
  'dzaky': 'ذَكِيّ',
  'dzaki': 'ذَكِيّ',
  'zaki': 'زَكِيّ',
  'afnan': 'أَفْنَان',
  'alif': 'أَلِف',
  'arya': 'آرْيَا',
  'bintang': 'نَجْم',
  'satria': 'فَارِس',
  'putra': 'بُوتْرَا',
  'putri': 'بُوتْرِي',
  'pratama': 'بْرَاتَامَا',
  'perdana': 'بِرْدَانَا',
  'wijaya': 'وِيجَايَا',
  'kurniawan': 'كُورْنِيَاوَان',
  'setiawan': 'سِيتِيَاوَان',
  'santoso': 'سَانْتُوسُو',
  'rahma': 'رَحْمَة',
  'rahmah': 'رَحْمَة',
  'rahmat': 'رَحْمَة'
};

/**
 * Phonetic transliterator for arbitrary Indonesian / Latin word to Arabic
 */
function transliterateWordToPhoneticArabic(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!clean) return '';

  if (KNOWN_NAME_MAPPINGS[clean]) {
    return KNOWN_NAME_MAPPINGS[clean];
  }

  // Common clusters
  let res = clean
    .replace(/kh/g, 'خ')
    .replace(/sy/g, 'ش')
    .replace(/sh/g, 'ص')
    .replace(/th/g, 'ث')
    .replace(/ts/g, 'ث')
    .replace(/dz/g, 'ذ')
    .replace(/dh/g, 'ض')
    .replace(/zh/g, 'ظ')
    .replace(/gh/g, 'غ')
    .replace(/ng/g, 'نغ')
    .replace(/ny/g, 'ني')
    .replace(/aa/g, 'َا')
    .replace(/ii/g, 'ِي')
    .replace(/uu/g, 'ُو')
    .replace(/ai/g, 'َيْ')
    .replace(/au/g, 'َوْ');

  const charMap: Record<string, string> = {
    a: 'ا',
    b: 'ب',
    c: 'تش',
    d: 'د',
    e: 'ي',
    f: 'ف',
    g: 'غ',
    h: 'ه',
    i: 'ي',
    j: 'ج',
    k: 'ك',
    l: 'ل',
    m: 'م',
    n: 'ن',
    o: 'و',
    p: 'ب',
    q: 'ق',
    r: 'ر',
    s: 'س',
    t: 'ت',
    u: 'و',
    v: 'ف',
    w: 'و',
    x: 'كس',
    y: 'ي',
    z: 'ز',
    "'": 'ء'
  };

  let output = '';
  for (let i = 0; i < res.length; i++) {
    const ch = res[i];
    if (charMap[ch]) {
      output += charMap[ch];
    } else {
      output += ch;
    }
  }

  return output;
}

/**
 * Converts a full student name from Latin Indonesian to Arabic script
 * Example: "Ahmad Fauzan Pratama" -> "أَحْمَد فَوْزَان بْرَاتَامَا"
 */
export function transliterateStudentNameToArabic(fullName: string): string {
  if (!fullName || !fullName.trim()) return '';

  const words = fullName.trim().split(/\s+/);
  const arabicWords = words.map(w => transliterateWordToPhoneticArabic(w));

  return arabicWords.join(' ');
}
