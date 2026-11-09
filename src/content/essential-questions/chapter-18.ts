import type { QuestionSeed } from '../question-helpers';

export const chapter18EssentialQuestionSeeds: QuestionSeed[] = [
  {
    id: 'q45', lessonId: 'gp-posterior-inference', type: 'multiple_choice',
    prompt: 'A GP posterior has latent variance v at a test input. A future measurement adds independent zero-mean Gaussian noise with variance σ_n². What is its predictive variance, conditional on fixed hyperparameters?',
    options: ['v+σ_n²', 'v because training already included noise', 'v−σ_n²'],
    answer: 'v+σ_n²',
    hints: ['Separate uncertainty in the function value from independent noise in a new measurement.'],
    explanation: 'The new measurement is f*+ε*, with independent ε* of variance σ_n², so variances add. Training noise already affects the posterior v, but does not remove future measurement noise. The predictive mean stays the latent mean because the added noise has mean zero.',
  },
  {
    id: 'q46', lessonId: 'gp-posterior-inference', type: 'numeric',
    prompt: 'For one training input, the kernel variance is 1, observation-noise variance is 0.25, test prior variance is 1, and train/test cross-covariance is 0.5. What is the posterior latent variance at the test input?',
    answer: 0.8, tolerance: 0.001,
    hints: ['Subtract cross-covariance squared divided by the noisy training variance from the test prior variance.'],
    explanation: 'The noisy training variance is C=1+0.25=1.25. Conditioning gives latent variance 1−0.5²/1.25=1−0.2=0.8. A future noisy observation instead has variance 0.8+0.25=1.05; the question asks for the latent variance.',
  },
  {
    id: 'q47', version: 2, lessonId: 'gp-posterior-inference', type: 'multiple_choice', application: true,
    prompt: 'A sensor GP adds independent measurement-noise variance to every entry of the training covariance and the train/test cross-covariance. It then labels the latent posterior band as a band for the next noisy reading. Which calculation repairs both errors?',
    options: [
      'Add noise to every training entry but leave cross-covariances unchanged; condition on that matrix; add fresh measurement-noise variance for the next reading.',
      'Add noise only to the training diagonal and leave cross-covariances unchanged; condition for the latent posterior; add fresh noise variance for the next reading and label the bands separately.',
      'Add noise only to the training diagonal and cross-covariance diagonal; condition for the latent posterior; use the same band for latent values and the next reading.',
      'Add noise only to the training diagonal and leave cross-covariances unchanged; condition for the latent posterior; label that band as a future-reading band because training already included noise.',
    ],
    answer: 'Add noise only to the training diagonal and leave cross-covariances unchanged; condition for the latent posterior; add fresh noise variance for the next reading and label the bands separately.',
    hints: ['Independent noise at different measurements has zero cross-covariance; a future reading introduces fresh noise.'],
    explanation: 'Adding the same noise variance everywhere imposes spurious correlations between independent measurement errors. The training diagonal captures noisy evidence without changing latent kernel cross-covariances. A new reading has its own independent error, so its variance exceeds the latent variance by the measurement-noise variance.',
  },
  {
    id: 'q48', lessonId: 'gp-regression-practice', type: 'multiple_choice',
    prompt: 'A small GP fit maximizes its training log marginal likelihood over RBF length scale and observation noise. What does that result establish?',
    options: ['It selects parameters within the chosen model family; held-out checks must still assess its assumptions', 'It guarantees correct confidence bands under any distribution shift', 'It minimizes only training squared error and ignores covariance complexity'],
    answer: 'It selects parameters within the chosen model family; held-out checks must still assess its assumptions',
    hints: ['The objective combines target fit and a log-determinant term under an assumed kernel and likelihood.'],
    explanation: 'The quadratic fit term and log determinant balance data explanation with covariance volume under the GP assumptions. Optimizing that objective cannot prove an RBF kernel is suitable for a discontinuity or guarantee generalization. Held-out errors, residual patterns, and predictive intervals provide separate evidence.',
  },
  {
    id: 'q49', lessonId: 'gp-regression-practice', type: 'numeric',
    prompt: 'A GP code trace starts with K=[[2,0.6],[0.6,2]], noise_var=0.1, and C=K+noise_var*I before Cholesky factorization. What is C[0,0]? Here noise_var is already a variance, and no jitter is added.',
    answer: 2.1, tolerance: 0.001,
    hints: ['Add the supplied variance once to each diagonal entry; do not square it again.'],
    explanation: 'C[0,0]=2+0.1=2.1; the off-diagonal stays 0.6 because the observation noise is independent. The value 0.1 is a variance, not a standard deviation. Numerical jitter would be a separately recorded diagonal perturbation, and Cholesky would factor C rather than K.',
  },
  {
    id: 'q50', version: 2, lessonId: 'gp-regression-practice', type: 'multiple_choice', application: true,
    prompt: 'An RBF GP with a very long length scale produces narrow bands while smoothing away a real sensor regime jump. Nearly duplicate inputs also make its near-zero-noise covariance hard to factor. A teammate proposes increasing jitter until both problems disappear. Which plan separates the issues correctly?',
    options: [
      'Increase jitter until factorization succeeds; treat it as measured sensor noise; use the resulting narrow bands to verify that the regime jump is modeled.',
      'Use stable Cholesky solves and record small jitter with sensitivity checks; keep the long-scale kernel; accept successful factorization as evidence that the uncertainty bands are calibrated.',
      'Use stable solves, check precision and small recorded jitter sensitivity; estimate noise separately; compare kernel or regime alternatives with deployment-matched held-out residuals and predictive intervals.',
      'Replace the kernel to represent the jump; explicitly invert the near-singular covariance without numerical checks; select the model solely by its training fit.',
    ],
    answer: 'Use stable solves, check precision and small recorded jitter sensitivity; estimate noise separately; compare kernel or regime alternatives with deployment-matched held-out residuals and predictive intervals.',
    hints: ['Separate the reliability of the matrix computation from the assumptions about the function and measurement noise.'],
    explanation: 'Jitter can stabilize a nearly singular covariance by perturbing its diagonal. It does not establish the measurement-noise level or make a long-scale RBF prior appropriate for a jump. Stable computation and credible uncertainty require separate checks: numerical sensitivity, model alternatives, and evaluation on data withheld under a deployment-relevant split.',
  },
];
