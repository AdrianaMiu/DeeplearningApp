import { describe, expect, it } from 'vitest';
import { createLearningCatalog, getAvailableLearningEntries, getChapterLearningSummary, validateLearningCatalog } from '../../src/content/catalog';
import { chapterLearningMap } from '../../src/content/course-map';
import { curriculumInventory } from '../../src/content/inventory';
import { learningEntries } from '../../src/content/lessons';
import sourceManifest from '../../src/content/studio-source-manifest.json';

const introduction = learningEntries.find((entry) => entry.id === 'introduction-studio')!;
const tensor = learningEntries.find((entry) => entry.id === 'tensor-shapes')!;
const replaceIntroduction = (replacement: unknown) => learningEntries.map((entry) => entry === introduction ? replacement : entry);

describe('learning catalog', () => {
  it('reports duplicate and missing catalog identities', () => {
    const entries = learningEntries.filter((entry) => entry.id !== 'tensor-shapes');
    const catalog = createLearningCatalog({ entries: [...entries, { ...introduction }] });
    expect(catalog.validateLearningCatalog().map(({ code, entryId }) => ({ code, entryId }))).toEqual([
      { code: 'DUPLICATE_ENTRY_ID', entryId: 'introduction-studio' },
      { code: 'MISSING_CORE_ENTRY', entryId: 'tensor-shapes' },
    ]);
    expect(catalog.getAvailableLearningEntries().some((entry) => entry.id === 'introduction-studio')).toBe(false);
  });

  it('rejects invalid source references', () => {
    const fixture = { ...introduction, sourceRefs: [
      { ...introduction.sourceRefs[0], sectionId: 'missing-section' },
      { ...introduction.sourceRefs[0], sourceHash: 'wrong' },
      { ...introduction.sourceRefs[0], pdfPageStart: 0 },
      { ...introduction.sourceRefs[0], printedStart: '3', printedEnd: '3', pdfPageStart: 43, pdfPageEnd: 43 },
    ] };
    const catalog = createLearningCatalog({ entries: replaceIntroduction(fixture) });
    expect(catalog.validateLearningCatalog().map(({ code }) => code)).toEqual([
      'UNKNOWN_SECTION_ID', 'MANIFEST_REFERENCE_MISSING',
      'SOURCE_HASH_MISMATCH', 'MANIFEST_REFERENCE_MISSING',
      'INVALID_PAGE_SPAN', 'MANIFEST_REFERENCE_MISSING',
      'MANIFEST_REFERENCE_MISSING',
    ]);
  });

  it('excludes an invalid entry without crashing', () => {
    const fixture = { ...introduction, id: 'malformed-fixture', sourceRefs: undefined };
    const catalog = createLearningCatalog({ entries: [...learningEntries, fixture, null] });
    expect(catalog.validateLearningCatalog()).toEqual([
      expect.objectContaining({ code: 'INVALID_ENTRY', entryId: 'malformed-fixture' }),
      expect.objectContaining({ code: 'INVALID_ENTRY' }),
    ]);
    expect(catalog.getAvailableLearningEntries().map((entry) => entry.id)).not.toContain('malformed-fixture');
    expect(catalog.getAvailableLearningEntries()).toHaveLength(32);
    expect(learningEntries).toHaveLength(32);
  });

  it.each([
    ['chapterId', 'unknown-chapter', 'UNKNOWN_CHAPTER_ID'],
    ['milestoneId', 'unknown-milestone', 'UNKNOWN_MILESTONE_ID'],
  ])('excludes an entry with invalid %s', (field, value, code) => {
    const catalog = createLearningCatalog({ entries: replaceIntroduction({ ...introduction, [field]: value }) });
    expect(catalog.validateLearningCatalog()).toContainEqual(expect.objectContaining({ code, entryId: introduction.id }));
    expect(catalog.getChapterLearningSummary('chapter-1').availability).toBe('indexed');
  });

  it.each([
    { pdfPageEnd: 41 }, { pdfPageEnd: 1186 }, { pdfPageStart: 42.5 },
    { printedEnd: '1' }, { printedStart: '' }, { printedStart: '3' },
  ])('rejects an invalid source span %j', (change) => {
    const catalog = createLearningCatalog({ entries: replaceIntroduction({ ...introduction,
      sourceRefs: [{ ...introduction.sourceRefs[0], ...change }],
    }) });
    expect(catalog.validateLearningCatalog()).toContainEqual(expect.objectContaining({ code: 'INVALID_PAGE_SPAN', entryId: introduction.id }));
    expect(catalog.getAvailableLearningEntries().some((entry) => entry.id === introduction.id)).toBe(false);
  });

  it('requires a studio manifest record with the correct source identity', () => {
    const missing = createLearningCatalog({ entries: learningEntries, sourceManifest: { ...sourceManifest, studios: [] } });
    expect(missing.getAvailableLearningEntries()).toHaveLength(12);
    expect(missing.validateLearningCatalog()[0]).toMatchObject({ code: 'MANIFEST_REFERENCE_MISSING', entryId: 'introduction-studio' });
    const wrongHash = createLearningCatalog({ entries: learningEntries, sourceManifest: { ...sourceManifest, sourceHash: 'wrong' } });
    expect(wrongHash.getAvailableLearningEntries()).toHaveLength(12);
    expect(wrongHash.validateLearningCatalog()).toContainEqual(expect.objectContaining({ code: 'SOURCE_HASH_MISMATCH' }));
  });

  it('derives available, partial, and indexed summaries from valid core entries', () => {
    const catalog = createLearningCatalog({ entries: learningEntries.filter((entry) => entry.id !== tensor.id) });
    const partial = catalog.getChapterLearningSummary('chapter-2');
    expect(partial).toMatchObject({ chapterId: 'chapter-2', milestoneId: 'foundations', title: 'Preliminaries',
      availability: 'partial', deepLessonCount: 9, studioCount: 0, questionCount: 0,
      coreEntryIds: chapterLearningMap.get('chapter-2')!.coreEntryIds,
    });
    expect(partial.availableEntryIds).not.toContain('tensor-shapes');
    expect(partial.issues).toContainEqual(expect.objectContaining({ code: 'MISSING_CORE_ENTRY', entryId: 'tensor-shapes' }));
    expect(catalog.getChapterLearningSummary('chapter-1')).toMatchObject({ availability: 'available', studioCount: 1, deepLessonCount: 0,
      purpose: 'Identify the pieces of a machine learning system.', questionCount: 4,
      authoredSectionCount: 0, authoredExerciseCount: 0, unclassifiedSectionCount: 17, remainingExerciseCount: 4,
    });
    expect(createLearningCatalog({ entries: [] }).getChapterLearningSummary('chapter-1')).toMatchObject({ availability: 'indexed', availableEntryIds: [] });
    expect(catalog.getChapterLearningSummary('unknown')).toMatchObject({ chapterId: 'unknown', availability: 'indexed', issues: [expect.objectContaining({ code: 'UNKNOWN_CHAPTER_ID' })] });
  });

  it('counts chapter check IDs and inventory records without changing inventory statuses', () => {
    const before = JSON.stringify(curriculumInventory);
    const catalog = createLearningCatalog({ entries: replaceIntroduction({ ...introduction, chapterCheckQuestionIds: ['check-1', 'check-2'] }) });
    expect(catalog.getChapterLearningSummary('chapter-1')).toMatchObject({ questionCount: 2,
      sourceSectionCount: 17, exerciseCount: 4,
    });
    expect(JSON.stringify(curriculumInventory)).toBe(before);
  });

  it('excludes an entry whose known section belongs to another chapter', () => {
    const catalog = createLearningCatalog({ entries: learningEntries.map((entry) => entry === tensor
      ? { ...tensor, sourceRefs: introduction.sourceRefs } : entry) });
    expect(catalog.validateLearningCatalog()).toContainEqual(expect.objectContaining({ code: 'INVALID_ENTRY', entryId: 'tensor-shapes', sectionId: '1.1' }));
    expect(catalog.getChapterLearningSummary('chapter-2').deepLessonCount).toBe(9);
  });

  it('excludes studio coverage that belongs to another chapter', () => {
    const catalog = createLearningCatalog({ entries: replaceIntroduction({ ...introduction,
      sectionCoverage: [{ sectionId: '2.1.1', objective: 'Read tensor shapes', depth: 'introduced' }],
    }) });
    expect(catalog.validateLearningCatalog()).toContainEqual(expect.objectContaining({ code: 'INVALID_ENTRY', entryId: introduction.id, sectionId: '2.1.1' }));
    expect(catalog.getChapterLearningSummary('chapter-1').availability).toBe('indexed');
  });

  it.each([
    { title: '' }, { views: null }, { contentStatus: 'drafted' }, { interaction: { kind: 'shape-path' } },
    { sourceRefs: [] }, { sectionCoverage: [{ sectionId: 'missing', objective: 'Test', depth: 'introduced' }] },
  ])('excludes incomplete studio anatomy %j', (change) => {
    const catalog = createLearningCatalog({ entries: replaceIntroduction({ ...introduction, ...change }) });
    expect(catalog.validateLearningCatalog()).toContainEqual(expect.objectContaining({ entryId: introduction.id,
      code: 'sectionCoverage' in change ? 'UNKNOWN_SECTION_ID' : 'INVALID_ENTRY',
    }));
    expect(catalog.getChapterLearningSummary('chapter-1').availability).toBe('indexed');
  });

  it('keeps all production paths available and returns stable, isolated result arrays', () => {
    expect(validateLearningCatalog()).toEqual([]);
    expect(getAvailableLearningEntries()).toHaveLength(32);
    for (const chapterId of chapterLearningMap.keys()) expect(getChapterLearningSummary(chapterId).availability).toBe('available');
    const catalog = createLearningCatalog({ entries: [...learningEntries, { ...tensor }] });
    const issues = catalog.validateLearningCatalog();
    expect(catalog.validateLearningCatalog()).toEqual(issues);
    issues.pop();
    catalog.getAvailableLearningEntries().pop();
    catalog.getChapterLearningSummary('chapter-1').availableEntryIds.pop();
    expect(catalog.validateLearningCatalog()).toHaveLength(1);
    expect(catalog.getAvailableLearningEntries()).toHaveLength(31);
    expect(catalog.getChapterLearningSummary('chapter-1').availableEntryIds).toEqual(['introduction-studio']);
  });
});
