import { describe, expect, it } from 'vitest';
import { curriculumInventory } from '../../src/content/inventory';
import { createCoverageCatalog } from '../../src/content/coverage/registry';
import { defineExerciseActivity, defineSectionActivity } from '../../src/content/coverage/authoring';

const sectionText = {
  objectives: ['Trace the section-specific operation through its inputs and outputs.'],
  explanation: 'This section-specific explanation connects the mathematical operation to the tensor axes it consumes and produces, so the learner can predict behavior before executing code.',
  workedExample: 'For a concrete two-axis input, label each dimension, apply the operation once, and verify both the resulting values and shape.',
  independentTask: 'Construct a different valid input, predict the complete output, and explain which axis-level constraint makes the operation valid.',
};

describe('compact coverage authoring quality gates', () => {
  it('builds source-owned activities without repeating chapter boilerplate', () => {
    const section = defineSectionActivity('chapter-1', '1.1', sectionText);
    const exercise = defineExerciseActivity('chapter-1', '1.9.exercise.1', {
      prompt: 'Apply the chapter distinction to a new decision system and justify which component learns from evidence.',
      hints: ['Identify the adjustable behavior.', 'Connect that behavior to the observations that change it.'],
      evaluation: { kind: 'rubric', criteria: ['Names the adjustable component.', 'Explains how evidence changes it.'] },
    });
    expect(section.sourceRefs[0]).toMatchObject({ sectionId: '1.1', sourceHash: curriculumInventory.sourceHash });
    expect(exercise.sourceRefs[0]).toMatchObject({ sectionId: '1.9', sourceHash: curriculumInventory.sourceHash });
  });

  it('rejects normalized duplicate teaching prose across different source records', () => {
    const first = defineSectionActivity('chapter-1', '1.1', sectionText);
    const duplicate = defineSectionActivity('chapter-1', '1.2', {
      ...sectionText,
      explanation: `  ${sectionText.explanation.toUpperCase()}  `,
    });
    const catalog = createCoverageCatalog({ inventory: curriculumInventory,
      sectionActivities: [first, duplicate], exerciseActivities: [], classifications: [],
    });
    expect(catalog.validateCoverage()).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_CONTENT', sourceId: '1.2' }),
    ]));
    expect(catalog.getSectionActivity('1.2')).toBeUndefined();
  });

  it('rejects prose that is too thin for a reviewed balanced activity', () => {
    const thin = defineSectionActivity('chapter-1', '1.1', {
      objectives: ['Know it.'], explanation: 'Short generic explanation.',
      workedExample: 'Try one.', independentTask: 'Do another.',
    });
    const catalog = createCoverageCatalog({ inventory: curriculumInventory,
      sectionActivities: [thin], exerciseActivities: [], classifications: [],
    });
    expect(catalog.validateCoverage()).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INVALID_ACTIVITY', sourceId: '1.1' }),
    ]));
    expect(catalog.getSectionActivity('1.1')).toBeUndefined();
  });
});
