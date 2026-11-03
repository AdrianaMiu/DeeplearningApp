export interface AllowedSourceRef {
  sectionId: string;
  printedStart: string;
  pdfPageStart: number;
}

export interface TutorContext {
  lessonId: string;
  conceptIds: string[];
  summary: string;
  sourceRefs: AllowedSourceRef[];
}

const ref = (sectionId: string, page: number): AllowedSourceRef => ({
  sectionId,
  printedStart: String(page),
  pdfPageStart: page + 40,
});

export const CONTENT_VERSION = 'd2l-companion-2026.11-v1';

export const tutorContexts: Record<string, TutorContext> = {
  'tensor-shapes': { lessonId: 'tensor-shapes', conceptIds: ['tensor-shape', 'indexing'], summary: 'Shape is a contract between axis meaning and axis length. Indexing a single position removes that axis; slicing preserves it.', sourceRefs: [ref('2.1.1', 30), ref('2.1.2', 33), ref('2.1.3', 34)] },
  broadcasting: { lessonId: 'broadcasting', conceptIds: ['broadcasting', 'tensor-shape'], summary: 'Broadcasting aligns axes from the right; dimensions must match or one must equal 1.', sourceRefs: [ref('2.1.4', 35), ref('2.1.5', 36), ref('2.1.6', 37)] },
  'data-preprocessing': { lessonId: 'data-preprocessing', conceptIds: ['preprocessing', 'data-leakage'], summary: 'Fit transformations on training data and apply the same learned mapping to validation and test data.', sourceRefs: [ref('2.2', 38)] },
  'linear-algebra-objects': { lessonId: 'linear-algebra-objects', conceptIds: ['linear-algebra', 'tensor-rank'], summary: 'Scalars, vectors, matrices, and tensors differ by axis count and meaning.', sourceRefs: [ref('2.3.1', 41), ref('2.3.2', 42), ref('2.3.3', 43), ref('2.3.4', 44)] },
  reductions: { lessonId: 'reductions', conceptIds: ['reduction', 'axis-reasoning'], summary: 'A reduction combines values along named axes; keepdim preserves reduced axes at size 1.', sourceRefs: [ref('2.3.5', 45), ref('2.3.6', 46), ref('2.3.7', 47)] },
  'products-and-norms': { lessonId: 'products-and-norms', conceptIds: ['dot-product', 'matrix-multiplication', 'norm'], summary: 'Elementwise, dot, and matrix products answer different shape and aggregation questions.', sourceRefs: [ref('2.3.8', 48), ref('2.3.9', 49), ref('2.3.10', 50), ref('2.3.11', 50)] },
  'derivatives-gradients': { lessonId: 'derivatives-gradients', conceptIds: ['derivative', 'gradient'], summary: 'Derivatives are local rates of change; gradients collect partial derivatives.', sourceRefs: [ref('2.4.1', 55), ref('2.4.2', 56), ref('2.4.3', 58)] },
  'chain-rule': { lessonId: 'chain-rule', conceptIds: ['chain-rule', 'computational-graph'], summary: 'Local sensitivities multiply along a path and add across paths that rejoin.', sourceRefs: [ref('2.4.4', 59)] },
  autodiff: { lessonId: 'autodiff', conceptIds: ['autodiff', 'detach'], summary: 'Reverse-mode autodiff records a computation graph; detach intentionally disconnects earlier operations.', sourceRefs: [ref('2.5', 60)] },
  'probability-expectation': { lessonId: 'probability-expectation', conceptIds: ['probability', 'expectation'], summary: 'An expectation is a probability-weighted average and need not be one possible outcome.', sourceRefs: [ref('2.6', 65)] },
  'linear-regression': { lessonId: 'linear-regression', conceptIds: ['linear-regression', 'squared-loss'], summary: 'Linear regression predicts Xw+b; mean squared error summarizes squared residuals.', sourceRefs: [ref('3.1.1', 83), ref('3.1.2', 88), ref('3.1.3', 88), ref('3.1.4', 90)] },
  'regression-training': { lessonId: 'regression-training', conceptIds: ['training-loop', 'synthetic-data'], summary: 'A complete training step clears gradients, predicts, computes loss, backpropagates, and updates parameters.', sourceRefs: [ref('3.3', 99), ref('3.4', 103)] },
};
