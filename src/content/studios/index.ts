import type { ChapterStudio } from '../../domain/types';
import { foundationStudios } from './foundations';
import { visionStudios } from './vision';
import { sequenceStudios } from './sequences';
import { systemsStudios } from './systems';
import { advancedStudios } from './advanced';
import { appendixStudios } from './appendices';

export { foundationStudios, visionStudios, sequenceStudios, systemsStudios, advancedStudios, appendixStudios };
export const chapterStudios: ChapterStudio[] = [
  ...foundationStudios, ...visionStudios, ...sequenceStudios,
  ...systemsStudios, ...advancedStudios, ...appendixStudios,
];
