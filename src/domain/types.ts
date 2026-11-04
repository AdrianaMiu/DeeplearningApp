export type ContentStatus = 'unconverted' | 'drafted' | 'reviewed' | 'published';
export type ConceptState = 'not_started' | 'learning' | 'practiced' | 'demonstrated' | 'retained';
export type QuestionType = 'multiple_choice' | 'numeric' | 'shape' | 'code_trace' | 'debugging' | 'explanation' | 'transfer';
export type GradingMethod = 'deterministic' | 'rubric' | 'ai_provisional';
export type TutorSupportLevel = 'none' | 'hint' | 'explanation' | 'feedback' | 'revealed';

export interface SourceRef {
  sectionId: string;
  printedStart: string;
  printedEnd?: string;
  pdfPageStart: number;
  pdfPageEnd?: number;
  sourceHash: string;
  companionCreated: boolean;
}

export interface CurriculumRecord {
  id: string;
  title: string;
  order: number;
  contentStatus: ContentStatus;
  source: SourceRef;
}

export interface ChapterRecord extends CurriculumRecord {
  kind: 'chapter' | 'appendix';
}

export interface SectionRecord extends CurriculumRecord {
  parentId: string;
  level: number;
}

export interface ExerciseReference extends CurriculumRecord {
  sectionId: string;
  sourceExerciseNumber: number;
}

export interface OrientationRecord extends CurriculumRecord {
  kind: 'orientation';
}

export interface CurriculumInventory {
  contentVersion: string;
  sourceTitle: string;
  sourceAuthors: string[];
  sourceHash: string;
  sourcePageCount: number;
  chapters: ChapterRecord[];
  sections: SectionRecord[];
  exercises: ExerciseReference[];
  orientation: OrientationRecord[];
}

export interface LessonView {
  intuition: string;
  math: string;
  code: string;
  workConnection: string;
}

export type MilestoneId = 'foundations' | 'models' | 'vision' | 'sequences' | 'systems' | 'broader';

export interface Milestone {
  id: MilestoneId;
  title: string;
  purpose: string;
  order: number;
  chapterIds: string[];
}

export interface ChapterLearningPath {
  chapterId: string;
  milestoneId: MilestoneId;
  coreEntryIds: string[];
}

export interface SectionCoverage {
  sectionId: string;
  objective: string;
  depth: 'introduced' | 'practiced' | 'reference';
}

export interface NumericControl {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
}

interface InteractionBase {
  title: string;
  instruction: string;
}

export type InteractionSpec = InteractionBase & (
  | {
    kind: 'parameter-lab';
    controls: NumericControl[];
    model: 'softmax' | 'dropout' | 'optimizer' | 'rbf-kernel' | 'search-budget' | 'gan-balance';
  }
  | {
    kind: 'shape-path';
    steps: { label: string; inputShape: number[]; outputShape: number[]; explanation: string }[];
  }
  | {
    kind: 'sequence-stepper';
    steps: { label: string; input: string; state: string; output: string; explanation: string }[];
  }
  | {
    kind: 'matrix-explorer';
    matrix: number[][];
    operation: 'attention' | 'matmul' | 'eigen';
  }
  | {
    kind: 'decision-canvas';
    prompt: string;
    options: { id: string; label: string; feedback: string; recommended?: boolean }[];
  }
  | {
    kind: 'distribution-explorer';
    controls: NumericControl[];
    observations: number[];
    model: 'normal' | 'bernoulli' | 'gaussian-process';
  }
);

export interface LessonBase {
  id: string;
  title: string;
  question: string;
  objectives: string[];
  prerequisites: string[];
  conceptIds: string[];
  sourceRefs: SourceRef[];
  views: LessonView;
  predictionPrompt: string;
  workedExample: string;
  independentTask: string;
  misconceptions: string[];
  teachBackPrompt: string;
  contentStatus: Extract<ContentStatus, 'reviewed' | 'published'>;
  durationMinutes: number;
}

export interface DeepLesson extends LessonBase {
  kind: 'deep-lesson';
  chapterId: string;
  milestoneId: MilestoneId;
}

export interface ChapterStudio extends LessonBase {
  kind: 'chapter-studio';
  chapterId: string;
  milestoneId: MilestoneId;
  purpose: string;
  capability: string;
  sectionCoverage: SectionCoverage[];
  interaction: InteractionSpec;
  chapterCheckQuestionIds: string[];
}

export type LearningEntry = DeepLesson | ChapterStudio;
export type Lesson = LearningEntry;

export interface Question {
  id: string;
  version: number;
  lessonId?: string;
  conceptIds: string[];
  sourceRefs: SourceRef[];
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer: string | number | string[];
  tolerance?: number;
  rubric?: string[];
  hints: string[];
  misconceptionTags: string[];
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  applicationEvidence: boolean;
}

export interface Attempt {
  id: string;
  questionId: string;
  questionVersion: number;
  conceptIds: string[];
  response: string;
  timestamp: string;
  score: number;
  gradingMethod: GradingMethod;
  confidence: 1 | 2 | 3 | 4 | 5;
  hintsUsed: number;
  solutionRevealed: boolean;
  tutorSupportLevel: TutorSupportLevel;
  applicationEvidence: boolean;
}

export interface ReviewEvent {
  id: string;
  conceptId: string;
  attemptId: string;
  timestamp: string;
  intervalIndex: number;
  dueAt: string;
}

export interface SessionRecord {
  id: string;
  lessonId?: string;
  goal: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  resumeStep: string;
  reflection?: string;
}

export interface NoteRecord {
  id: string;
  conceptId?: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearnerSettings {
  id: 'learner-settings';
  language: 'en' | 'ro-help';
  normalSessionMinutes: number;
  minimumSessionMinutes: number;
  reviewBudgetMinutes: number;
  guidedOrder: boolean;
  lowEnergyMode: boolean;
  diagnosticCompleted: boolean;
  diagnosticSkipped: boolean;
  updatedAt: string;
}

export interface ContentVersion {
  schemaVersion: 1;
  contentVersion: string;
  sourceHash: string;
}

export interface ProgressExportV1 {
  schemaVersion: 1;
  contentVersion: string;
  exportedAt: string;
  attempts: Attempt[];
  reviews: ReviewEvent[];
  sessions: SessionRecord[];
  notes: NoteRecord[];
  settings: LearnerSettings;
}
