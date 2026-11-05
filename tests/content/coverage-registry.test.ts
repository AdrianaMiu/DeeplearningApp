import { describe, expect, it } from 'vitest';
import { curriculumInventory } from '../../src/content/inventory';
import { createCoverageCatalog } from '../../src/content/coverage/registry';

const source = {
  sectionId: '1.1', printedStart: '4', pdfPageStart: 44,
  sourceHash: curriculumInventory.sourceHash, companionCreated: true as const,
};
const sectionActivity = {
  sourceId: '1.1', chapterId: 'chapter-1', contentStatus: 'reviewed' as const,
  objectives: ['Distinguish programs from learned models.'],
  explanation: 'A model acquires adjustable behavior from evidence and an objective.',
  workedExample: 'Compare a fixed threshold with a fitted linear boundary.',
  independentTask: 'Name which parts are learned in a small classifier.',
  sourceRefs: [source],
};
const exerciseActivity = {
  sourceId: '1.9.exercise.1', chapterId: 'chapter-1', contentStatus: 'reviewed' as const,
  prompt: 'Apply the chapter distinction to a new system and justify your classification.',
  hints: ['Identify the adjustable behavior.', 'Find the evidence used to adjust it.'],
  evaluation: { kind: 'rubric' as const, criteria: ['Names the adjustable component.', 'Connects it to evidence.'] },
  sourceRefs: [{ ...source, sectionId: '1.9', printedStart: '29', pdfPageStart: 69 }],
};

describe('detailed coverage registry', () => {
  it('exposes only schema-valid source-owned activities and honest chapter counts', () => {
    const catalog = createCoverageCatalog({ inventory: curriculumInventory,
      sectionActivities: [sectionActivity], exerciseActivities: [exerciseActivity], classifications: [],
    });

    expect(catalog.validateCoverage()).toEqual([]);
    expect(catalog.getSectionActivity('1.1')).toEqual(sectionActivity);
    expect(catalog.getExerciseActivity('1.9.exercise.1')).toEqual(exerciseActivity);
    expect(catalog.getChapterCoverageSummary('chapter-1')).toMatchObject({
      authoredSectionCount: 1, authoredExerciseCount: 1, remainingExerciseCount: 3,
      sourceSectionCount: 17, exerciseCount: 4, unclassifiedSectionCount: 16,
    });
    expect(curriculumInventory.sections.find((item) => item.id === '1.1')?.contentStatus).toBe('unconverted');
  });

  it('rejects duplicate identities and incomplete reviewed content', () => {
    const catalog = createCoverageCatalog({ inventory: curriculumInventory,
      sectionActivities: [sectionActivity, { ...sectionActivity }, { ...sectionActivity, sourceId: '1.2', independentTask: '' }],
      exerciseActivities: [], classifications: [],
    });

    expect(catalog.validateCoverage()).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_ACTIVITY_ID', sourceId: '1.1' }),
      expect.objectContaining({ code: 'INVALID_ACTIVITY', sourceId: '1.2' }),
    ]));
    expect(catalog.getSectionActivity('1.1')).toBeUndefined();
    expect(catalog.getSectionActivity('1.2')).toBeUndefined();
  });

  it('rejects unknown IDs, foreign chapter ownership, and mismatched source references', () => {
    const catalog = createCoverageCatalog({ inventory: curriculumInventory,
      sectionActivities: [
        { ...sectionActivity, sourceId: 'missing' },
        { ...sectionActivity, sourceId: '2.1.1', chapterId: 'chapter-1', sourceRefs: [{ ...source, sectionId: '2.1.1', printedStart: '30', pdfPageStart: 70 }] },
        { ...sectionActivity, sourceId: '1.2', sourceRefs: [{ ...source, sectionId: '1.1' }] },
      ], exerciseActivities: [], classifications: [],
    });

    expect(catalog.validateCoverage()).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNKNOWN_SOURCE_ID', sourceId: 'missing' }),
      expect.objectContaining({ code: 'CHAPTER_MISMATCH', sourceId: '2.1.1' }),
      expect.objectContaining({ code: 'SOURCE_REFERENCE_MISMATCH', sourceId: '1.2' }),
    ]));
  });

  it('keeps non-substantive classifications explicit and disjoint from authored activities', () => {
    const catalog = createCoverageCatalog({ inventory: curriculumInventory,
      sectionActivities: [sectionActivity], exerciseActivities: [], classifications: [
        { sourceId: '1.1', kind: 'container' },
        { sourceId: 'missing', kind: 'summary' },
        { sourceId: '1.8', kind: 'summary' },
      ],
    });

    expect(catalog.validateCoverage()).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ACTIVITY_CLASSIFICATION_CONFLICT', sourceId: '1.1' }),
      expect.objectContaining({ code: 'UNKNOWN_SOURCE_ID', sourceId: 'missing' }),
    ]));
    expect(catalog.getClassification('1.8')).toEqual({ sourceId: '1.8', kind: 'summary' });
    expect(catalog.getChapterCoverageSummary('chapter-1').classifiedNonSubstantiveCount).toBe(1);
  });
});
