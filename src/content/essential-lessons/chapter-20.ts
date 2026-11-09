import type { DeepLesson } from '../../domain/types';
import { companionSource } from '../source';

export const chapter20EssentialLessons: DeepLesson[] = [
  {
    kind: 'deep-lesson', id: 'gan-training-step', chapterId: 'chapter-20', milestoneId: 'broader',
    title: 'Trace a complete GAN training step',
    question: 'How do two optimizers use the same adversarial game without updating the wrong network?',
    objectives: ['Trace real and fake targets through both alternating updates.', 'Choose gradient boundaries and compute explicitly reduced losses.'],
    prerequisites: ['Separate two adversarial updates', 'Use autodiff without surrendering the graph'],
    conceptIds: ['adversarial-training', 'gradient-boundary', 'binary-cross-entropy'],
    sourceRefs: [companionSource('20.1.2', 915), companionSource('20.1.3', 915), companionSource('20.1.4', 915)],
    views: {
      intuition: 'A training step first teaches the discriminator to separate real examples from current generated examples. It then teaches the generator to fool the updated discriminator. Real data is the reference distribution; fresh latent noise supplies generator inputs. Each phase has its own optimizer and target labels.',
      math: 'Let D return a real-data probability. Here L_D = (−mean ln D(x) − mean ln(1−D(G(z))))/2: each mean reduces a minibatch and the half gives equal weight to real and fake batches. For G use the non-saturating variant L_G = −mean ln D(G(z)), targeting real labels. The original minimax generator instead minimizes mean ln(1−D(G(z))); these are distinct objectives with the same intended direction.',
      code: 'With D returning logits, use BCEWithLogitsLoss with mean reduction. Clear optimizer_D gradients; compute real logits and fake logits from G(z).detach(); form 0.5*(BCE(real, ones)+BCE(fake, zeros)), backward, and step optimizer_D. Clear optimizer_G gradients; temporarily disable gradients for D parameters; recompute G(z) and a fresh D forward using its updated weights. Compute BCE(D(G(z)), ones), backward, and step optimizer_G, then restore D parameter gradients. Keep the G-to-D computation recorded: no detach or no_grad in this phase. Optimizer parameter lists must be disjoint.',
      workConnection: 'Before a long image-generation run, save parameter copies around each phase: the D phase should change only D and the G phase only G. Inspect finite gradients, sample quality, and variation across latent draws. Both losses describe a changing opponent and cannot alone certify progress or diversity.',
    },
    predictionPrompt: 'During the discriminator phase, predict which parameters receive gradients when fake images are detached. During the generator phase, would wrapping D in no_grad preserve learning for G?',
    workedExample: 'For one real and one fake example with D(real)=0.8 and D(fake)=0.25, the chosen discriminator loss is 0.5*(−ln 0.8−ln 0.75)≈0.255. Update only D. Suppose a new forward after that update gives D(G(z))=0.3: the non-saturating generator loss is −ln 0.3≈1.204. Its target is 1, and its gradient flows through D into G while D parameters stay fixed for this phase.',
    independentTask: 'Write the two-phase pseudocode with distinct optimizers, gradient clearing, targets, loss reductions, and the detach boundary. Calculate the discriminator loss for probabilities 0.9 and 0.4. Name a parameter-change check for each phase and explain why the G phase needs a fresh D forward.',
    misconceptions: ['Freezing discriminator parameters does not mean disabling derivatives through its input.', 'Real and fake labels for the discriminator differ; the non-saturating generator uses real targets.', 'A summed loss and an equally weighted mean over real and fake batches differ by a factor of two.'],
    teachBackPrompt: 'Explain one complete GAN step to a colleague, naming every target, optimizer, gradient boundary, and loss reduction. Explain why a small loss alone does not establish a useful generator.',
    contentStatus: 'reviewed', durationMinutes: 15,
  },
  {
    kind: 'deep-lesson', id: 'dcgan-practice', chapterId: 'chapter-20', milestoneId: 'broader',
    title: 'Build and diagnose a DCGAN image path',
    question: 'How do image shapes, value ranges, and sample checks make a convolutional GAN trainable?',
    objectives: ['Trace spatial dimensions through a convolutional generator and discriminator.', 'Diagnose range mismatches and distinguish plausible samples from diverse generation.'],
    prerequisites: ['Trace a complete GAN training step', 'Choose the product that matches the question'],
    conceptIds: ['dcgan', 'transposed-convolution', 'image-normalization', 'mode-collapse'],
    sourceRefs: [companionSource('20.2.1', 918), companionSource('20.2.2', 919), companionSource('20.2.3', 921), companionSource('20.2.4', 923)],
    views: {
      intuition: 'A DCGAN generator grows a small latent representation into an image using learned transposed convolutions. A convolutional discriminator reduces images to one real/fake score per example. Their spatial directions differ, but both networks learn their filters from the adversarial losses rather than using a fixed image-resizing rule.',
      math: 'For dilation 1 and output padding 0, transposed convolution produces H_out=(H_in−1)s−2p+k. A 4×4 kernel with stride 2 and padding 1 doubles a spatial dimension. Ordinary convolution gives H_out=floor((H_in+2p−k)/s)+1 with dilation 1, so the same kernel, stride, and padding halve an even dimension. Track channels separately from these spatial formulas.',
      code: 'One 64×64 RGB design maps latent (N,Z,1,1) to a 4×4 feature map using kernel 4, stride 1, padding 0, then grows 4→8→16→32→64 with kernel 4, stride 2, padding 1. Hidden G blocks use batch normalization and ReLU; its final three-channel output uses tanh. D uses strided convolutions and leaky ReLU, with batch normalization in intermediate blocks and a final scalar logit. Feed those logits directly to BCEWithLogitsLoss. Normalize real pixels to [−1,1] to match G, and convert back only for display.',
      workConnection: 'Start with assertions for (N,3,64,64) images, matching real/fake value ranges, and one discriminator output per image. Compare a fixed latent grid over checkpoints to follow changes and fresh latent draws to inspect diversity. Repeated plausible images suggest mode collapse; a discriminator mean near 0.5 cannot rule it out. Architecture choices support training but do not guarantee convergence.',
    },
    predictionPrompt: 'For an 8×8 feature map, predict the output of a transposed convolution with kernel 4, stride 2, padding 1. If G ends in tanh but real pixels remain in [0,255], what easy cue can D exploit?',
    workedExample: 'For latent (8,100,1,1), an initial transposed convolution with 512 output channels gives (8,512,4,4). Four doubling blocks with output channels 256,128,64,3 produce (8,256,8,8), (8,128,16,16), (8,64,32,32), and (8,3,64,64). Four matching downsampling blocks in D take 64→32→16→8→4, and a final kernel-4, stride-1, padding-0 convolution produces (8,1,1,1). For byte-valued real pixels, x/127.5−1 maps 0 to −1 and 255 to 1, matching tanh output.',
    independentTask: 'Design a 32×32 grayscale variant: list every spatial size and choose the final channel count. State the real-image normalization and discriminator output shape. Then diagnose a run where many distinct latent inputs yield nearly identical images, proposing a diversity check alongside both loss curves.',
    misconceptions: ['Transposed convolution is a learned mapping, not the mathematical inverse of an arbitrary convolution.', 'A tanh generator output requires a matching real-data scale, not just matching tensor shapes.', 'Realistic individual images do not prove coverage of different modes of the data.'],
    teachBackPrompt: 'Trace one latent vector to an RGB image and back to a discriminator logit. Explain how you would check spatial sizes, pixel ranges, and diversity before interpreting the losses.',
    contentStatus: 'reviewed', durationMinutes: 15,
  },
];
