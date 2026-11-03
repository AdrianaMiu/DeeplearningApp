import { useMemo, useState } from 'react';

import { broadcastShapes } from '../domain/broadcasting';
import { finiteDifference, tangentLine } from '../domain/gradients';
import { gradientStep, meanSquaredError, predictLine, type Point } from '../domain/regression';

const parseShape = (value: string) => value.split(/[x, ]+/).filter(Boolean).map(Number);

export function BroadcastingExplorer() {
  const [left, setLeft] = useState('4, 1, 6');
  const [right, setRight] = useState('3, 6');
  const result = useMemo(() => broadcastShapes(parseShape(left), parseShape(right)), [left, right]);
  return <section className="lab-card"><p className="kicker">Lab 01</p><h2>Broadcasting explorer</h2><p>Dimensions align from the right. Edit either shape and inspect every axis.</p><div className="inline-fields"><label>Left shape<input value={left} onChange={(event) => setLeft(event.target.value)} /></label><label>Right shape<input value={right} onChange={(event) => setRight(event.target.value)} /></label></div><p className={result.compatible ? 'result-good' : 'result-bad'}>{result.compatible ? `Compatible → (${result.resultShape.join(', ')})` : result.reason}</p><table aria-label="Broadcasting axis compatibility"><thead><tr><th>Aligned axis</th><th>Left</th><th>Right</th><th>Result</th></tr></thead><tbody>{result.axes.map((axis, index) => <tr key={index}><th>{index - result.axes.length}</th><td>{axis.left}</td><td>{axis.right}</td><td>{axis.compatible ? axis.result : 'incompatible'}</td></tr>)}</tbody></table></section>;
}

export function GradientExplorer() {
  const [point, setPoint] = useState(3);
  const [step, setStep] = useState(0.01);
  const fn = (x: number) => x * x;
  const derivative = (x: number) => 2 * x;
  const tangent = tangentLine(fn, derivative, point);
  const numeric = finiteDifference(fn, point, step);
  return <section className="lab-card"><p className="kicker">Lab 02</p><h2>Gradient and tangent explorer</h2><p>For f(x)=x², the symbolic slope is 2x. A centered finite difference estimates the same local sensitivity.</p><label>Point x = {point}<input type="range" min="-5" max="5" step="0.25" value={point} onChange={(event) => setPoint(Number(event.target.value))} /></label><label>Finite-difference step h = {step}<input type="range" min="0.001" max="0.2" step="0.001" value={step} onChange={(event) => setStep(Number(event.target.value))} /></label><table aria-label="Gradient numeric comparison"><thead><tr><th>Method</th><th>Slope</th><th>Difference</th></tr></thead><tbody><tr><th>Symbolic 2x</th><td>{tangent.slope.toFixed(4)}</td><td>reference</td></tr><tr><th>Centered finite difference</th><td>{numeric.toFixed(4)}</td><td>{Math.abs(numeric - tangent.slope).toExponential(2)}</td></tr></tbody></table></section>;
}

const points: Point[] = [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }];
export function RegressionExplorer() {
  const [weight, setWeight] = useState(0.5);
  const [bias, setBias] = useState(0);
  const predictions = predictLine(points, weight, bias);
  const loss = meanSquaredError(points, weight, bias);
  function takeStep() { const next = gradientStep(points, { weight, bias }, 0.05); setWeight(next.weight); setBias(next.bias); }
  return <section className="lab-card lab-card--wide"><p className="kicker">Lab 03</p><h2>Fit the regression line</h2><p>Adjust weight and bias. Residuals are prediction minus target; mean squared loss gives large misses extra influence.</p><div className="regression-layout"><div><label>Weight w = {weight.toFixed(2)}<input type="range" min="-1" max="4" step="0.05" value={weight} onChange={(event) => setWeight(Number(event.target.value))} /></label><label>Bias b = {bias.toFixed(2)}<input type="range" min="-2" max="3" step="0.05" value={bias} onChange={(event) => setBias(Number(event.target.value))} /></label><p className="loss-readout">MSE <strong>{loss.toFixed(3)}</strong></p><button className="button button--primary" onClick={takeStep}>Take one training step</button></div><svg className="regression-plot" viewBox="0 0 360 220" role="img" aria-label={`Regression line with weight ${weight.toFixed(2)}, bias ${bias.toFixed(2)}, and loss ${loss.toFixed(3)}`}><path d="M35 15V190H340" className="axis" />{points.map((point, index) => { const px = 45 + point.x * 90; const py = 185 - point.y * 22; const predictedY = 185 - predictions[index] * 22; return <g key={point.x}><line x1={px} y1={py} x2={px} y2={predictedY} className="residual"/><circle cx={px} cy={py} r="5" className="point" /></g>; })}<line x1="45" y1={185 - bias * 22} x2="315" y2={185 - (weight * 3 + bias) * 22} className="fit-line" /></svg></div><table aria-label="Regression residuals"><thead><tr><th>x</th><th>Target</th><th>Prediction</th><th>Residual</th></tr></thead><tbody>{points.map((point, index) => <tr key={point.x}><td>{point.x}</td><td>{point.y}</td><td>{predictions[index].toFixed(2)}</td><td>{(predictions[index] - point.y).toFixed(2)}</td></tr>)}</tbody></table></section>;
}
