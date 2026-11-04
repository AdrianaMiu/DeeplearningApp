import type { ChapterStudio, InteractionSpec } from '../../domain/types';
import { chapterLearningMap } from '../course-map';
import { companionSource } from '../source';

interface StudioSeed {
  id: string; chapter: number; title: string; question: string; purpose: string; capability: string;
  refs: [string, number][]; concepts: string[]; intuition: string; math: string; code: string; work: string;
  prediction: string; example: string; task: string; misconception: string; interaction: InteractionSpec;
}

export function makeStudio(seed: StudioSeed): ChapterStudio {
  const chapterId = `chapter-${seed.chapter}`;
  return {
    kind: 'chapter-studio', chapterId, milestoneId: chapterLearningMap.get(chapterId)!.milestoneId,
    id: seed.id, title: seed.title, question: seed.question, purpose: seed.purpose, capability: seed.capability,
    objectives: [seed.capability], prerequisites: [seed.chapter === 1 ? 'No prior chapters' : 'Earlier model and tensor lessons'],
    conceptIds: seed.concepts, sourceRefs: seed.refs.map(([id, page]) => companionSource(id, page)),
    sectionCoverage: seed.refs.map(([sectionId]) => ({ sectionId, objective: seed.capability, depth: 'introduced' })),
    views: { intuition: seed.intuition, math: seed.math, code: seed.code, workConnection: seed.work },
    predictionPrompt: seed.prediction, workedExample: seed.example, independentTask: seed.task,
    misconceptions: [seed.misconception], teachBackPrompt: `Explain ${seed.title.toLowerCase()} to a colleague using your own example.`,
    interaction: seed.interaction, chapterCheckQuestionIds: [1, 2, 3, 4].map((n) => `studio-${seed.chapter}-q${n}`), contentStatus: 'reviewed', durationMinutes: 35,
  };
}

export const foundationStudios: ChapterStudio[] = [
  makeStudio({ id: 'introduction-studio', chapter: 1, title: 'Frame a learning problem', question: 'When is learning from examples useful?',
    purpose: 'Identify the pieces of a machine learning system.', capability: 'Describe data, model, objective, and learning algorithm in a concrete task.', refs: [['1.1', 2], ['1.2', 4]], concepts: ['learning-problem', 'model'],
    intuition: 'A learned system uses experience to improve a task where hand-written rules may be difficult to specify.', math: 'A model f maps an input x to a prediction; an objective measures how well predictions meet the task.', code: 'Represent examples as input and target pairs, then pass inputs through a model and evaluate its predictions.', work: 'Frame a speech command system by identifying audio inputs, desired outputs, and examples for evaluation.',
    prediction: 'Which examples would help a wake-word system distinguish speech from background noise?', example: 'A wake-word detector takes short audio segments as input and predicts whether the phrase is present.', task: 'Choose another prediction task and identify its data, model, objective, and evaluation examples.', misconception: 'A model is not the same thing as its training data.',
    interaction: { kind: 'decision-canvas', title: 'Choose useful data', instruction: 'Select a training set for a wake-word detector.', prompt: 'Which data best represents the task?', options: [{ id: 'varied', label: 'Labeled speech and background audio', feedback: 'Both positive and negative examples help define the decision.', recommended: true }, { id: 'one', label: 'One clean recording', feedback: 'One recording misses speaker and noise variation.' }] } }),
  makeStudio({ id: 'classification-studio', chapter: 4, title: 'Classify with softmax', question: 'How do logits become class probabilities?', purpose: 'Connect classification scores to probability and loss.', capability: 'Interpret softmax probabilities and cross-entropy for a labeled example.', refs: [['4.1', 127], ['4.2', 136]], concepts: ['softmax', 'classification'],
    intuition: 'A classifier assigns a score to each class; softmax turns these scores into a distribution.', math: 'p_i = exp(z_i) / sum_j exp(z_j); cross-entropy for class y is -log(p_y).', code: 'Produce logits for a batch and apply a cross-entropy loss against integer class labels.', work: 'For image classification, inspect uncertainty as well as the predicted label.', prediction: 'What happens to a class probability when only its logit increases?', example: 'Equal logits for two classes yield probabilities 0.5 and 0.5 and loss -log(0.5) for either label.', task: 'Compare the loss of the true class when its probability rises from 0.5 to 0.8.', misconception: 'The largest logit need not itself be a probability.',
    interaction: { kind: 'parameter-lab', title: 'Change a logit', instruction: 'Adjust a score and observe the softmax distribution.', model: 'softmax', controls: [{ id: 'logit', label: 'Logit', min: -3, max: 3, step: 0.5, initial: 0 }] } }),
  makeStudio({ id: 'mlp-studio', chapter: 5, title: 'Compose hidden layers', question: 'Why does an MLP need nonlinear hidden layers?', purpose: 'Trace an MLP and understand regularization.', capability: 'Explain how hidden activations and dropout affect an MLP.', refs: [['5.1', 170], ['5.6', 198]], concepts: ['mlp', 'dropout'],
    intuition: 'Hidden layers build intermediate features; nonlinear activations let their composition represent more than one linear map.', math: 'An MLP can compute y = W₂ ReLU(W₁x+b₁)+b₂; dropout randomly masks activations during training.', code: 'Stack linear layers with a nonlinear activation and enable dropout during training.', work: 'Compare training and validation behavior when increasing model capacity or dropout.', prediction: 'What happens if two linear layers are composed without a nonlinear activation?', example: 'ReLU maps [-1, 2] to [0, 2], changing the negative input while preserving the positive input.', task: 'Trace a two-layer network on a small input and identify where dropout acts during training.', misconception: 'Stacking linear layers alone does not create a nonlinear function.',
    interaction: { kind: 'parameter-lab', title: 'Explore dropout', instruction: 'Change the dropout rate and inspect its effect.', model: 'dropout', controls: [{ id: 'rate', label: 'Dropout rate', min: 0, max: 0.9, step: 0.1, initial: 0.2 }] } }),
  makeStudio({ id: 'builders-guide-studio', chapter: 6, title: 'Build with modules', question: 'How do modules organize a model and its parameters?', purpose: 'Make model construction and parameter access explicit.', capability: 'Trace data through modules and identify their parameters.', refs: [['6.1', 212], ['6.2', 219]], concepts: ['modules', 'parameters'],
    intuition: 'Modules package computations and parameters into reusable building blocks.', math: 'A dense layer maps x to Wx+b; composing modules applies their functions in sequence.', code: 'Compose layers in a sequential module and inspect named parameters and their shapes.', work: 'Parameter inspection helps diagnose an unexpected layer size or missing trainable weight.', prediction: 'How many outputs does a linear layer with three output features produce per example?', example: 'A linear layer from four inputs to three outputs has a 3×4 weight matrix and three biases.', task: 'Sketch a two-layer module and list the shapes of each weight and bias.', misconception: 'A module may contain other modules as well as parameters.',
    interaction: { kind: 'shape-path', title: 'Trace module shapes', instruction: 'Follow one example through the layers.', steps: [{ label: 'Dense layer', inputShape: [1, 4], outputShape: [1, 3], explanation: 'Four input features map to three output features.' }, { label: 'Output layer', inputShape: [1, 3], outputShape: [1, 2], explanation: 'Three hidden features map to two output scores.' }] } }),
];
