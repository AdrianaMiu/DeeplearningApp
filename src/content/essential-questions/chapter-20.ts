import type { QuestionSeed } from '../question-helpers';

export const chapter20EssentialQuestionSeeds: QuestionSeed[] = [
  {
    id: 'q33', lessonId: 'gan-training-step', type: 'multiple_choice',
    prompt: 'A discriminator phase computes BCE(D(G(z).detach()), fake targets). Which gradient behavior should you predict?',
    options: ['D receives gradients, while this fake branch sends no gradients into G', 'Both D and G receive gradients through this fake branch', 'Neither network receives gradients because detach disables all differentiation'],
    answer: 'D receives gradients, while this fake branch sends no gradients into G',
    hints: ['The detach boundary occurs at D’s input, before D’s own computations.'],
    explanation: 'Detaching generated images blocks the path back into G while leaving D’s parameter derivatives available. Clearing old gradients is still necessary; detach does not clear gradient buffers.',
  },
  {
    id: 'q34', lessonId: 'gan-training-step', type: 'numeric',
    prompt: 'For one real and one fake example, D(real)=0.9 and D(fake)=0.4. Compute L_D=0.5*(−ln D(real)−ln(1−D(fake))) using natural logarithms. Round to three decimals.',
    answer: 0.308, tolerance: 0.001,
    hints: ['The fake term uses 1−0.4. Apply the factor 0.5 after adding both logarithmic terms.'],
    explanation: 'The two terms are −ln 0.9≈0.105361 and −ln 0.6≈0.510826. Their equally weighted average is 0.308093, rounding to 0.308. The sum 0.616 would use a different reduction.',
  },
  {
    id: 'q35', version: 2, lessonId: 'gan-training-step', type: 'multiple_choice', application: true,
    prompt: 'In an image-generation run, G parameters change during the D phase. Its optimizer contains both networks, and the fake-image branch is not detached. Which repair and verification plan correctly isolates both updates?',
    options: [
      'Keep the shared optimizer; clear both gradient buffers after backward; compare only the combined loss before and after each phase.',
      'Use disjoint optimizers; detach fake images only for D; preserve the G-to-D gradient for G; compare both networks’ parameters around each phase.',
      'Use disjoint optimizers; detach fake images in both phases; compare both networks’ parameters around each phase to confirm separate updates.',
      'Keep the shared optimizer; detach fake images only for D; step both networks in the G phase; compare generated samples instead of parameters.',
    ],
    answer: 'Use disjoint optimizers; detach fake images only for D; preserve the G-to-D gradient for G; compare both networks’ parameters around each phase.',
    hints: ['A gradient boundary and an optimizer parameter list control different parts of the update.'],
    explanation: 'Connected fake samples allow D’s loss to differentiate into G, and an optimizer containing G can apply that unintended gradient. Separate parameter lists and the D-phase detach boundary prevent this. Per-phase parameter comparisons test the update behavior directly.',
  },
  {
    id: 'q36', lessonId: 'dcgan-practice', type: 'multiple_choice',
    prompt: 'A DCGAN generator replaces a stride-2 transposed-convolution block with an ordinary stride-2 convolution using kernel 4 and padding 1. What happens to an 8×8 feature map?',
    options: ['It shrinks to 4×4 instead of growing to 16×16', 'Both blocks produce 16×16 because their strides match', 'It keeps 8×8 because padding always preserves size'],
    answer: 'It shrinks to 4×4 instead of growing to 16×16',
    hints: ['Ordinary and transposed convolution have different spatial-size formulas.'],
    explanation: 'Ordinary convolution gives floor((8+2−4)/2)+1=4, whereas transposed convolution gives (8−1)×2−2+4=16. Substituting the former reverses the intended spatial growth.',
  },
  {
    id: 'q37', lessonId: 'dcgan-practice', type: 'numeric',
    prompt: 'A transposed convolution receives a 12×12 feature map with kernel 4, stride 2, padding 1, dilation 1, and output padding 0. What is the output height?',
    answer: 24,
    hints: ['Use H_out=(H_in−1)×stride−2×padding+kernel for these settings.'],
    explanation: 'The output height is (12−1)×2−2×1+4=24. Width also becomes 24 for the same settings; the number of output channels is a separate layer choice.',
  },
  {
    id: 'q38', version: 2, lessonId: 'dcgan-practice', type: 'multiple_choice', application: true,
    prompt: 'A DCGAN discriminator quickly separates every batch. Real RGB pixels are still in [0,255], while G ends in tanh. Which repair and follow-up checks address the mismatch without overstating the result?',
    options: [
      'Map real pixels with x/255 to [0,1]; check matching shapes; treat a discriminator mean of 0.5 as proof of realistic and diverse images.',
      'Map real pixels with x/127.5−1 to [−1,1]; check shapes and ranges; declare diversity solved as soon as both losses stop changing.',
      'Map real pixels with x/127.5−1 to [−1,1]; check shapes and ranges; inspect fixed and fresh latent samples for quality and diversity alongside both losses.',
      'Keep real pixels in [0,255]; normalize only generated images for display; check fresh latent samples once the discriminator loss is small.',
    ],
    answer: 'Map real pixels with x/127.5−1 to [−1,1]; check shapes and ranges; inspect fixed and fresh latent samples for quality and diversity alongside both losses.',
    hints: ['A classifier can exploit pixel scale without learning image structure.'],
    explanation: 'A scale mismatch supplies D with an easy cue unrelated to image realism. Matching ranges removes that cue but does not guarantee stable training or prevent mode collapse; generated samples and their variation still need inspection.',
  },
];
