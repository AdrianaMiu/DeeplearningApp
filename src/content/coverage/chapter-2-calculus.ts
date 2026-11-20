import { defineExerciseActivity, defineSectionActivity } from './authoring';
import type { CoverageClassification, ExerciseActivity, SectionActivity } from './types';

const chapterId = 'chapter-2';

export const calculusSections: SectionActivity[] = [
  defineSectionActivity(chapterId, '2.4', {
    objectives: [
      'Explain how a limit describes a quantity approached by successive approximations.',
      'Connect local rates of change to reducing a training loss.',
    ],
    explanation: 'An inscribed regular polygon divides a circle into triangles. As the number of sides grows, the triangle heights approach the radius and the total length of their bases approaches the circumference. This illustrates how limits let us reason from approximations to an exact quantity. Differentiation uses a limit to describe local change, which helps choose parameter updates during training. Performance on unseen data still needs to be measured separately.',
    workedExample: 'For a circle of radius 1, the inscribed square has area 2 and the inscribed regular hexagon has area 3√3/2 ≈ 2.60. With more sides the area approaches π. In a loss problem, a similar limit argument with shrinking parameter steps gives the local slope rather than an area.',
    independentTask: 'Draw the inscribed square and hexagon in a unit circle and derive both areas by dividing each polygon into triangles. Explain what the triangle heights and total base length approach as the number of sides increases.',
  }),
  defineSectionActivity(chapterId, '2.4.1', {
    objectives: [
      'Estimate a derivative using difference quotients and interpret its sign.',
      'Use elementary derivatives and the sum, product, and quotient rules.',
    ],
    explanation: 'The quotient (f(x + h) − f(x))/h averages the change in f per unit change in x. When it approaches the same finite value from both sides as h approaches zero, that value is the derivative. The constant and power rules handle polynomial terms, and eˣ and ln(x) have derivatives eˣ and 1/x on their domains. Sums differentiate term by term, products require one term for each differentiated factor, and quotients use the numerator g f′ − f g′ divided by g². A training objective can use a differentiable surrogate when a metric such as accuracy provides no usable slope.',
    workedExample: 'For f(x) = 2x² + x at x = 2, expanding the forward quotient gives 9 + 2h. The estimates for h = 0.1 and h = −0.1 are 9.2 and 8.8, and both approach 9. The power and sum rules give f′(x) = 4x + 1, confirming the limit.',
    independentTask: 'For f(x) = x³ − 2x, compute forward difference quotients at x = 2 for h = 0.1, 0.01, and 0.001. Compare them with the symbolic derivative and use its sign to predict which direction locally decreases f.',
  }),
  defineSectionActivity(chapterId, '2.4.2', {
    objectives: [
      'Compute and plot a tangent line alongside its function.',
      'Configure a reusable plot with aligned coordinates, labels, and a legend.',
    ],
    explanation: 'At x = a, the tangent line has height f(a) and slope f′(a), so its values are f(a) + f′(a)(x − a). Evaluate both curves on a shared grid to compare them. In a notebook, choose the figure size and display format separately from axis settings such as labels, limits, scales, and legend. A reusable plotting helper can apply those settings to multiple series on the same axes.',
    workedExample: 'At a = 2, f(x) = x² has height 4 and slope 4. Plot x² and 4 + 4(x − 2) over x from 1 to 3, using distinct line styles and labeling the tangent point. The vertical gap is (x − 2)², so it shrinks quickly near the contact point.',
    independentTask: 'Overlay g(x) = x³ with its tangent at x = 1 on a common set of axes. Label the curves, mark their point of contact, and use a narrower x-axis range to examine how closely they agree near that point.',
  }),
  defineSectionActivity(chapterId, '2.4.3', {
    objectives: [
      'Compute each partial derivative by holding every other coordinate fixed.',
      'Assemble partial derivatives in the same order as the input coordinates.',
    ],
    explanation: 'For a scalar function with several inputs, the partial derivative with respect to one coordinate is the slope along that coordinate direction. The gradient collects these slopes into a vector. At a differentiable point, its dot product with a small displacement gives the first-order change in the function. For a square matrix A, differentiating xᵀAx gives (A + Aᵀ)x. With A equal to the identity this gives 2x, and the same elementwise calculation gives 2X for the gradient of the squared Frobenius norm of a matrix X.',
    workedExample: 'For f(x, y) = x² + xy + 2y², the partials are 2x + y and x + 4y. At (1, 2) the gradient is (4, 9), so a change of (0.01, −0.01) predicts a loss change of about −0.05. Direct substitution gives −0.0498.',
    independentTask: 'Compute the gradient of f(x, y) = 2x² − 3xy + y² at (1, 2). Estimate the effect of increasing y by 0.01 while holding x fixed, and compare the estimate with the exact difference.',
  }),
  defineSectionActivity(chapterId, '2.4.4', {
    objectives: [
      'Multiply local derivatives along a dependency path.',
      'Sum the contributions of all paths from an input to a scalar output.',
    ],
    explanation: 'For y = f(g(x)), a small input change first passes through g and then through f, so the two local derivatives multiply. When x affects y through several intermediate values u, each path contributes a product and the products add. If J has entries J[j,i] = ∂uⱼ/∂xᵢ, then the gradient with respect to x is Jᵀ times the gradient with respect to u.',
    workedExample: 'Let u = x², v = 3x, and L = uv. At x = 2 the path through u contributes v · 2x = 24 and the path through v contributes u · 3 = 12. Their sum, 36, agrees with differentiating L = 3x³ directly.',
    independentTask: 'Let u = a + b, v = ab, and L = u² + v. Draw the dependency graph and compute both partial derivatives of L at (a, b) = (2, 3) by adding path contributions. Check them against the expanded formula.',
  }),
  defineSectionActivity(chapterId, '2.4.5', {
    objectives: [
      'Distinguish the order of function evaluation from the order of gradient propagation.',
      'Use a calculated gradient to justify a small loss-reducing parameter step.',
    ],
    explanation: 'A forward pass evaluates the inputs and intermediate values needed for the loss. A backward pass starts from the loss and propagates its sensitivities through the calculation in reverse order, combining contributions from every downstream use of an intermediate. This systematic application of the chain rule is the basis of backpropagation. For a differentiable loss and a nonzero gradient, a sufficiently small step opposite that gradient decreases the loss locally.',
    workedExample: 'For L(w) = (2w − 1)² at w = 1, the forward pass evaluates r = 2w − 1 = 1 and L = 1. The backward pass multiplies ∂L/∂r = 2 by ∂r/∂w = 2 to get ∂L/∂w = 4. Taking a step of −0.1 · 4 gives w = 0.6 and L = 0.04.',
    independentTask: 'For L(w) = (3w − 2)², list the forward values at w = 1 and compute the backward derivatives. Try two positive learning rates, one that reduces the loss and one that increases it, and compare the resulting losses.',
  }),
];

function exercise(number: number, prompt: string, hints: string[], criteria: string[]): ExerciseActivity {
  return defineExerciseActivity(chapterId, `2.4.6.exercise.${number}`, {
    prompt,
    hints,
    evaluation: { kind: 'rubric', criteria },
  });
}

export const calculusExercises: ExerciseActivity[] = [
  exercise(1, 'Starting from the difference quotient, derive the derivatives of a constant c, the power xⁿ, the exponential eˣ, and the natural logarithm ln(x). State the domain and any elementary limits you use.',
    ['For a positive integer n, factor the difference of powers or expand (x + h)ⁿ. For other exponents on x > 0, use xⁿ = exp(n ln x) in the quotient.', 'For the exponential, factor out eˣ. For the logarithm, replace h by xt and use the limit of ln(1 + t)/t as t tends to zero.'],
    ['Obtains 0, nxⁿ⁻¹, eˣ, and 1/x respectively.', 'Justifies the base limits directly or states them as separate established limits.', 'States where the power calculation applies and restricts the logarithm to positive x.']),
  exercise(2, 'Derive the sum, product, and quotient rules using the difference quotient of each combined function. Assume f and g are differentiable at x, and include the condition needed for f/g.',
    ['For the product, add and subtract a cross term to isolate a difference quotient for each factor.', 'For the quotient, put the numerator over a common denominator before separating the differences.'],
    ['Shows the limit steps yielding f′ + g′, f′g + fg′, and (f′g − fg′)/g².', 'Uses continuity of differentiable factors when taking the limits.', 'Requires g(x) ≠ 0 for the quotient and explains why this also keeps the denominator nonzero nearby.']),
  exercise(3, 'Use the product rule to derive the derivative of c f(x) when c is a real constant.',
    ['Treat the constant as a function g(x) = c.', 'Write out both product-rule terms before simplifying.'],
    ['Applies the product rule with g′(x) = 0 and obtains c f′(x).']),
  exercise(4, 'Differentiate xˣ on the real domain x > 0. Show how you handle the variable in both the base and the exponent.',
    ['Rewrite xˣ as exp(x ln x), or take the logarithm first.', 'The derivative of x ln x needs the product rule.'],
    ['Derives xˣ(ln x + 1) on x > 0.', 'Accounts for the derivative of both factors in x ln x.']),
  exercise(5, 'Describe the local geometric meaning of f′(a) = 0. Give a function and point where it holds and use nearby values to decide whether your example is an extremum.',
    ['The derivative gives the slope of the tangent line.', 'Consider x² and x³ at zero if you want examples with different behavior.'],
    ['Identifies a horizontal tangent and zero first-order change.', 'Checks the derivative at the stated example point and examines nearby behavior.', 'Recognizes that a stationary point may be a minimum, a maximum, or neither.']),
  exercise(6, 'Plot y = x³ − 1/x together with its tangent line at x = 1. Include the point of contact and choose a plotting range that avoids the singularity at zero.',
    ['Compute the height and derivative at x = 1 before generating plot data.', 'Differentiate −x⁻¹ as a power and write the tangent in point-slope form.'],
    ['Uses f(1) = 0 and f′(1) = 4 to obtain y = 4(x − 1).', 'Labels both curves on common axes and marks (1, 0).']),
  exercise(7, 'Find the gradient of f(x₁, x₂) = 3x₁² + 5 exp(x₂). Show how each coordinate contributes.',
    ['Hold x₂ fixed for the first partial, then hold x₁ fixed for the second.', 'Return the partials in input-coordinate order.'],
    ['Obtains the vector (6x₁, 5 exp(x₂)) and explains why each partial ignores the term independent of its coordinate.']),
  exercise(8, 'Compute the gradient of the Euclidean norm f(x) = ‖x‖₂ for x ≠ 0. Use a one-dimensional slice through the origin to decide whether the gradient exists at x = 0.',
    ['Differentiate the square root of the sum of squares.', 'On the coordinate line x = te₁, the norm reduces to |t|. Compare slopes from t > 0 and t < 0.'],
    ['Derives ∇f(x) = x/‖x‖₂ away from zero.', 'Uses the unequal one-sided slopes on a coordinate line to show that the norm is nondifferentiable at zero.']),
  exercise(9, 'Write the derivatives ∂u/∂a and ∂u/∂b when u = f(x, y, z) and each of x, y, and z is itself a function of (a, b).',
    ['List the three paths from a to u and repeat for b.', 'Evaluate f’s partial derivatives at the intermediate values (x(a,b), y(a,b), z(a,b)).'],
    ['Obtains uₐ = fₓxₐ + fᵧyₐ + f_z zₐ and u_b = fₓx_b + fᵧy_b + f_z z_b.', 'Includes one derivative product per path for each input and evaluates it at the corresponding intermediate point.']),
  exercise(10, 'For an invertible scalar function f, derive a formula for the derivative of its inverse at y = f(x). State the assumptions required at the point of evaluation.',
    ['Differentiate f(f⁻¹(y)) = y with respect to y.', 'Check when it is valid to divide by f′(f⁻¹(y)).'],
    ['Obtains (f⁻¹)′(y) = 1/f′(f⁻¹(y)) using the chain rule.', 'Requires a nonzero derivative at the preimage and justifies or assumes local differentiability of the inverse, for example by applying the inverse function theorem to a continuously differentiable f.']),
];

export const calculusClassifications: CoverageClassification[] = [
  { sourceId: '2.4.6', kind: 'exercise-heading' },
];
