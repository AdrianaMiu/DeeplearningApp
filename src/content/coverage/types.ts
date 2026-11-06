import type { ContentStatus, SourceRef } from '../../domain/types';

export type ReviewedStatus = Extract<ContentStatus, 'reviewed' | 'published'>;
export type CoverageClassificationKind = 'container' | 'summary' | 'exercise-heading' | 'empty-placeholder' | 'reference';

export interface CoverageClassification {
  sourceId: string;
  kind: CoverageClassificationKind;
}

export interface SectionActivity {
  sourceId: string;
  chapterId: string;
  contentStatus: ReviewedStatus;
  objectives: string[];
  explanation: string;
  workedExample: string;
  independentTask: string;
  sourceRefs: SourceRef[];
}

export interface ExerciseActivity {
  sourceId: string;
  chapterId: string;
  contentStatus: ReviewedStatus;
  prompt: string;
  hints: string[];
  evaluation: { kind: 'answer'; answer: string; explanation: string }
    | { kind: 'rubric'; criteria: string[] };
  sourceRefs: SourceRef[];
}

export interface CoverageIssue {
  code: 'DUPLICATE_ACTIVITY_ID' | 'DUPLICATE_CONTENT' | 'INVALID_ACTIVITY' | 'UNKNOWN_SOURCE_ID' | 'CHAPTER_MISMATCH'
    | 'SOURCE_REFERENCE_MISMATCH' | 'INVALID_CLASSIFICATION' | 'ACTIVITY_CLASSIFICATION_CONFLICT';
  sourceId?: string;
  message: string;
}

export interface ChapterCoverageSummary {
  chapterId: string;
  sourceSectionCount: number;
  exerciseCount: number;
  authoredSectionCount: number;
  authoredExerciseCount: number;
  classifiedNonSubstantiveCount: number;
  unclassifiedSectionCount: number;
  remainingExerciseCount: number;
}
