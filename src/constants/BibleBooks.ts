import { Book } from '../types/bible';

export interface BibleBookMeta extends Book {
  aliases: string[];
}

export const BIBLE_BOOKS: BibleBookMeta[] = [
  // Old Testament (39 books)
  { id: 1, name: 'Genesis', abbreviation: 'Gen', testament: 'OT', chapters_count: 50, aliases: ['gen', 'genesis', 'ge', 'gn'] },
  { id: 2, name: 'Exodus', abbreviation: 'Exod', testament: 'OT', chapters_count: 40, aliases: ['ex', 'exod', 'exodus', 'exo', 'exodo'] },
  { id: 3, name: 'Leviticus', abbreviation: 'Lev', testament: 'OT', chapters_count: 27, aliases: ['lev', 'leviticus', 'le', 'lv', 'levitico'] },
  { id: 4, name: 'Numbers', abbreviation: 'Num', testament: 'OT', chapters_count: 36, aliases: ['num', 'numbers', 'nu', 'nm', 'nb', 'mga numero', 'numero'] },
  { id: 5, name: 'Deuteronomy', abbreviation: 'Deut', testament: 'OT', chapters_count: 34, aliases: ['deut', 'deuteronomy', 'dt', 'de', 'deuteronomio'] },
  { id: 6, name: 'Joshua', abbreviation: 'Josh', testament: 'OT', chapters_count: 24, aliases: ['josh', 'joshua', 'jos', 'jsh', 'josue'] },
  { id: 7, name: 'Judges', abbreviation: 'Judg', testament: 'OT', chapters_count: 21, aliases: ['judg', 'judges', 'jdg', 'jg', 'jdgs', 'mga maghuhukom', 'maghuhukom'] },
  { id: 8, name: 'Ruth', abbreviation: 'Ruth', testament: 'OT', chapters_count: 4, aliases: ['ruth', 'rth', 'ru', 'rut'] },
  { id: 9, name: '1 Samuel', abbreviation: '1Sam', testament: 'OT', chapters_count: 31, aliases: ['1sam', '1 samuel', '1samuel', '1st samuel', '1 sam', '1sa', '1s', 'i sam', 'i samuel', 'i sa'] },
  { id: 10, name: '2 Samuel', abbreviation: '2Sam', testament: 'OT', chapters_count: 24, aliases: ['2sam', '2 samuel', '2samuel', '2nd samuel', '2 sam', '2sa', '2s', 'ii sam', 'ii samuel', 'ii sa'] },
  { id: 11, name: '1 Kings', abbreviation: '1Kgs', testament: 'OT', chapters_count: 22, aliases: ['1kgs', '1 kings', '1kings', '1st kings', '1 kgs', '1ki', '1k', '1 kin', 'i kgs', 'i kings', '1kg', '1 mga hari', 'i mga hari', '1 hari', 'i hari'] },
  { id: 12, name: '2 Kings', abbreviation: '2Kgs', testament: 'OT', chapters_count: 25, aliases: ['2kgs', '2 kings', '2kings', '2nd kings', '2 kgs', '2ki', '2k', '2 kin', 'ii kgs', 'ii kings', '2kg', '2 mga hari', 'ii mga hari', '2 hari', 'ii hari'] },
  { id: 13, name: '1 Chronicles', abbreviation: '1Chr', testament: 'OT', chapters_count: 29, aliases: ['1chr', '1 chronicles', '1chronicles', '1st chronicles', '1 chr', '1ch', 'i chr', 'i chronicles', '1 chron', '1 mga cronicas', '1 cronicas', 'i cronicas'] },
  { id: 14, name: '2 Chronicles', abbreviation: '2Chr', testament: 'OT', chapters_count: 36, aliases: ['2chr', '2 chronicles', '2chronicles', '2nd chronicles', '2 chr', '2ch', 'ii chr', 'ii chronicles', '2 chron', '2 mga cronicas', '2 cronicas', 'ii cronicas'] },
  { id: 15, name: 'Ezra', abbreviation: 'Ezra', testament: 'OT', chapters_count: 10, aliases: ['ezra', 'ezr', 'ez', 'esdras'] },
  { id: 16, name: 'Nehemiah', abbreviation: 'Neh', testament: 'OT', chapters_count: 13, aliases: ['neh', 'nehemiah', 'ne', 'nehemias'] },
  { id: 17, name: 'Esther', abbreviation: 'Esth', testament: 'OT', chapters_count: 10, aliases: ['esth', 'esther', 'es', 'ester'] },
  { id: 18, name: 'Job', abbreviation: 'Job', testament: 'OT', chapters_count: 42, aliases: ['job', 'jb'] },
  { id: 19, name: 'Psalms', abbreviation: 'Ps', testament: 'OT', chapters_count: 150, aliases: ['ps', 'psalm', 'psalms', 'psa', 'pss', 'psm', 'salmo', 'mga salmo', 'sal'] },
  { id: 20, name: 'Proverbs', abbreviation: 'Prov', testament: 'OT', chapters_count: 31, aliases: ['prov', 'proverbs', 'prv', 'pr', 'pro', 'mga panultihon', 'panultihon', 'pan'] },
  { id: 21, name: 'Ecclesiastes', abbreviation: 'Eccl', testament: 'OT', chapters_count: 12, aliases: ['eccl', 'ecclesiastes', 'ecc', 'ec', 'qoh', 'eklesyastes', 'manugwali'] },
  { id: 22, name: 'Song of Solomon', abbreviation: 'Song', testament: 'OT', chapters_count: 8, aliases: ['song', 'song of solomon', 'songs', 'song of songs', 'sos', 'canticles', 'canticle of canticles', 'cant', 'awit sa mga awit', 'awit ni solomon'] },
  { id: 23, name: 'Isaiah', abbreviation: 'Isa', testament: 'OT', chapters_count: 66, aliases: ['isa', 'isaiah', 'is', 'isaias'] },
  { id: 24, name: 'Jeremiah', abbreviation: 'Jer', testament: 'OT', chapters_count: 52, aliases: ['jer', 'jeremiah', 'jr', 'jeremias'] },
  { id: 25, name: 'Lamentations', abbreviation: 'Lam', testament: 'OT', chapters_count: 5, aliases: ['lam', 'lamentations', 'la', 'mga pagbangotan', 'pagbangotan'] },
  { id: 26, name: 'Ezekiel', abbreviation: 'Ezek', testament: 'OT', chapters_count: 48, aliases: ['ezek', 'ezekiel', 'eze', 'ezk', 'ezequiel'] },
  { id: 27, name: 'Daniel', abbreviation: 'Dan', testament: 'OT', chapters_count: 12, aliases: ['dan', 'daniel', 'da', 'dn'] },
  { id: 28, name: 'Hosea', abbreviation: 'Hos', testament: 'OT', chapters_count: 14, aliases: ['hos', 'hosea', 'ho', 'oseas'] },
  { id: 29, name: 'Joel', abbreviation: 'Joel', testament: 'OT', chapters_count: 3, aliases: ['joel', 'joe', 'jl'] },
  { id: 30, name: 'Amos', abbreviation: 'Amos', testament: 'OT', chapters_count: 9, aliases: ['amos', 'am'] },
  { id: 31, name: 'Obadiah', abbreviation: 'Obad', testament: 'OT', chapters_count: 1, aliases: ['obad', 'obadiah', 'ob', 'oba', 'abdias'] },
  { id: 32, name: 'Jonah', abbreviation: 'Jonah', testament: 'OT', chapters_count: 4, aliases: ['jonah', 'jon', 'jnh', 'jonas'] },
  { id: 33, name: 'Micah', abbreviation: 'Mic', testament: 'OT', chapters_count: 7, aliases: ['mic', 'micah', 'mc', 'micheas', 'mikas'] },
  { id: 34, name: 'Nahum', abbreviation: 'Nah', testament: 'OT', chapters_count: 3, aliases: ['nah', 'nahum', 'na'] },
  { id: 35, name: 'Habakkuk', abbreviation: 'Hab', testament: 'OT', chapters_count: 3, aliases: ['hab', 'habakkuk', 'hb', 'habacuc'] },
  { id: 36, name: 'Zephaniah', abbreviation: 'Zeph', testament: 'OT', chapters_count: 3, aliases: ['zeph', 'zephaniah', 'zep', 'zp', 'sofonias'] },
  { id: 37, name: 'Haggai', abbreviation: 'Hag', testament: 'OT', chapters_count: 2, aliases: ['hag', 'haggai', 'hg', 'hageo'] },
  { id: 38, name: 'Zechariah', abbreviation: 'Zech', testament: 'OT', chapters_count: 14, aliases: ['zech', 'zechariah', 'zec', 'zc', 'zacarias'] },
  { id: 39, name: 'Malachi', abbreviation: 'Mal', testament: 'OT', chapters_count: 4, aliases: ['mal', 'malachi', 'ml', 'malaquias'] },

  // New Testament (27 books)
  { id: 40, name: 'Matthew', abbreviation: 'Matt', testament: 'NT', chapters_count: 28, aliases: ['matt', 'matthew', 'mt', 'mat', 'mateo'] },
  { id: 41, name: 'Mark', abbreviation: 'Mark', testament: 'NT', chapters_count: 16, aliases: ['mark', 'mrk', 'mk', 'mr', 'marcos'] },
  { id: 42, name: 'Luke', abbreviation: 'Luke', testament: 'NT', chapters_count: 24, aliases: ['luke', 'luk', 'lk', 'lucas'] },
  { id: 43, name: 'John', abbreviation: 'John', testament: 'NT', chapters_count: 21, aliases: ['john', 'jhn', 'jn', 'juan'] },
  { id: 44, name: 'Acts', abbreviation: 'Acts', testament: 'NT', chapters_count: 28, aliases: ['acts', 'act', 'ac', 'buhat', 'mga buhat', 'bht'] },
  { id: 45, name: 'Romans', abbreviation: 'Rom', testament: 'NT', chapters_count: 16, aliases: ['rom', 'romans', 'ro', 'rm', 'roma', 'mga taga-roma', 'mga taga roma'] },
  { id: 46, name: '1 Corinthians', abbreviation: '1Cor', testament: 'NT', chapters_count: 16, aliases: ['1cor', '1 corinthians', '1corinthians', '1st corinthians', '1 cor', '1co', '1c', 'i cor', 'i corinthians', '1 corinto', 'i corinto', '1 mga taga-corinto', '1 mga taga corinto'] },
  { id: 47, name: '2 Corinthians', abbreviation: '2Cor', testament: 'NT', chapters_count: 13, aliases: ['2cor', '2 corinthians', '2corinthians', '2nd corinthians', '2 cor', '2co', '2c', 'ii cor', 'ii corinthians', '2 corinto', 'ii corinto', '2 mga taga-corinto', '2 mga taga corinto'] },
  { id: 48, name: 'Galatians', abbreviation: 'Gal', testament: 'NT', chapters_count: 6, aliases: ['gal', 'galatians', 'ga', 'galacia', 'mga taga-galacia', 'mga taga galacia'] },
  { id: 49, name: 'Ephesians', abbreviation: 'Eph', testament: 'NT', chapters_count: 6, aliases: ['eph', 'ephesians', 'ep', 'efeso', 'mga taga-efeso', 'mga taga efeso'] },
  { id: 50, name: 'Philippians', abbreviation: 'Phil', testament: 'NT', chapters_count: 4, aliases: ['phil', 'philippians', 'php', 'pp', 'filipos', 'mga taga-filipos', 'mga taga filipos'] },
  { id: 51, name: 'Colossians', abbreviation: 'Col', testament: 'NT', chapters_count: 4, aliases: ['col', 'colossians', 'co', 'colosas', 'mga taga-colosas', 'mga taga colosas'] },
  { id: 52, name: '1 Thessalonians', abbreviation: '1Thess', testament: 'NT', chapters_count: 5, aliases: ['1thess', '1 thessalonians', '1thessalonians', '1st thessalonians', '1 thess', '1th', '1ts', 'i thess', 'i thessalonians', '1 tesalonica', 'i tesalonica', '1 mga taga-tesalonica', '1 mga taga tesalonica'] },
  { id: 53, name: '2 Thessalonians', abbreviation: '2Thess', testament: 'NT', chapters_count: 3, aliases: ['2thess', '2 thessalonians', '2thessalonians', '2nd thessalonians', '2 thess', '2th', '2ts', 'ii thess', 'ii thessalonians', '2 tesalonica', 'ii tesalonica', '2 mga taga-tesalonica', '2 mga taga tesalonica'] },
  { id: 54, name: '1 Timothy', abbreviation: '1Tim', testament: 'NT', chapters_count: 6, aliases: ['1tim', '1 timothy', '1timothy', '1st timothy', '1 tim', '1ti', '1t', 'i tim', 'i timothy', '1 timoteo', 'i timoteo'] },
  { id: 55, name: '2 Timothy', abbreviation: '2Tim', testament: 'NT', chapters_count: 4, aliases: ['2tim', '2 timothy', '2timothy', '2nd timothy', '2 tim', '2ti', '2t', 'ii tim', 'ii timothy', '2 timoteo', 'ii timoteo'] },
  { id: 56, name: 'Titus', abbreviation: 'Titus', testament: 'NT', chapters_count: 3, aliases: ['titus', 'tit', 'ti', 'tito'] },
  { id: 57, name: 'Philemon', abbreviation: 'Phlm', testament: 'NT', chapters_count: 1, aliases: ['phlm', 'philemon', 'phm', 'pm', 'filemon'] },
  { id: 58, name: 'Hebrews', abbreviation: 'Heb', testament: 'NT', chapters_count: 13, aliases: ['heb', 'hebrews', 'he', 'hebreohanon', 'mga hebreohanon', 'hebreo'] },
  { id: 59, name: 'James', abbreviation: 'Jas', testament: 'NT', chapters_count: 5, aliases: ['jas', 'james', 'jm', 'ja', 'santiago', 'sant'] },
  { id: 60, name: '1 Peter', abbreviation: '1Pet', testament: 'NT', chapters_count: 5, aliases: ['1pet', '1 peter', '1peter', '1st peter', '1 pet', '1pe', '1pt', '1p', 'i pet', 'i peter', '1 pedro', 'i pedro'] },
  { id: 61, name: '2 Peter', abbreviation: '2Pet', testament: 'NT', chapters_count: 3, aliases: ['2pet', '2 peter', '2peter', '2nd peter', '2 pet', '2pe', '2pt', '2p', 'ii pet', 'ii peter', '2 pedro', 'ii pedro'] },
  { id: 62, name: '1 John', abbreviation: '1John', testament: 'NT', chapters_count: 5, aliases: ['1john', '1 john', '1jn', '1st john', '1 jhn', '1jo', '1j', 'i jn', 'i john', '1 juan', 'i juan'] },
  { id: 63, name: '2 John', abbreviation: '2John', testament: 'NT', chapters_count: 1, aliases: ['2john', '2 john', '2jn', '2nd john', '2 jhn', '2jo', '2j', 'ii jn', 'ii john', '2 juan', 'ii juan'] },
  { id: 64, name: '3 John', abbreviation: '3John', testament: 'NT', chapters_count: 1, aliases: ['3john', '3 john', '3jn', '3rd john', '3 jhn', '3jo', '3j', 'iii jn', 'iii john', '3 juan', 'iii juan'] },
  { id: 65, name: 'Jude', abbreviation: 'Jude', testament: 'NT', chapters_count: 1, aliases: ['jude', 'jud', 'jd', 'judas'] },
  { id: 66, name: 'Revelation', abbreviation: 'Rev', testament: 'NT', chapters_count: 22, aliases: ['rev', 'revelation', 'revelations', 'rv', 'apocalypse', 'pinadayag', 'pina', 'bugna'] },
];

// Map alias -> BibleBookMeta for O(1) lookup
export const BOOK_ALIAS_MAP: Record<string, BibleBookMeta> = {};

BIBLE_BOOKS.forEach((book) => {
  BOOK_ALIAS_MAP[book.name.toLowerCase()] = book;
  BOOK_ALIAS_MAP[book.abbreviation.toLowerCase()] = book;
  book.aliases.forEach((alias) => {
    BOOK_ALIAS_MAP[alias.toLowerCase()] = book;
  });
});

export const getBookById = (id: number): BibleBookMeta | undefined => {
  return BIBLE_BOOKS.find((b) => b.id === id);
};

export const getBookByAlias = (alias: string): BibleBookMeta | undefined => {
  const normalized = alias.trim().toLowerCase().replace(/\./g, '');
  return BOOK_ALIAS_MAP[normalized];
};
