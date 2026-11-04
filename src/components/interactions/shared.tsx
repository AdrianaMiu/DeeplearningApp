import { useId } from 'react';
import type { NumericControl } from '../../domain/types';
import type { Result } from '../../domain/studio-interactions';

export function Output({ title, result }: { title: string; result: Result }) {
  return <><p role="status">{result.message} {result.rows.map(([label, value]) => `${label}: ${typeof value === 'number' ? Number(value.toPrecision(6)) : value}`).join('. ')}</p><table aria-label={`${title} results`}><thead><tr><th scope="col">Measure</th><th scope="col">Value</th></tr></thead><tbody>{result.rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{typeof value === 'number' ? Number(value.toPrecision(6)) : value}</td></tr>)}</tbody></table></>;
}
export function NumericInputs({ controls, values, change }: { controls: NumericControl[]; values: Record<string, number>; change: (id: string, value: number) => void }) {
  const prefix = useId();
  return <div>{controls.map(control => <div key={control.id}><label htmlFor={`${prefix}-${control.id}`}>{control.label}</label>{' '}<input id={`${prefix}-${control.id}`} type="number" min={control.min} max={control.max} step={control.step} value={Number.isFinite(values[control.id]) ? values[control.id] : ''} onChange={e => change(control.id, e.target.value === '' ? NaN : Number(e.target.value))} /></div>)}</div>;
}
