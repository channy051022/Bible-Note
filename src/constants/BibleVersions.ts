import { BibleVersion, BibleVersionMeta } from '../types/bible';

export const BIBLE_VERSIONS: BibleVersionMeta[] = [
  {
    id: 'KJV',
    name: 'King James Version',
    shortName: 'KJV',
    language: 'English',
    description: 'Authorized King James Version (1769)',
  },
  {
    id: 'CEB',
    name: 'Cebuano Pinadayag',
    shortName: 'CEB',
    language: 'Cebuano',
    description: 'Cebuano Bugna / Pinadayag Translation',
  },
];

export const getBibleVersionMeta = (versionId: BibleVersion): BibleVersionMeta => {
  return BIBLE_VERSIONS.find((v) => v.id === versionId) || BIBLE_VERSIONS[0];
};
