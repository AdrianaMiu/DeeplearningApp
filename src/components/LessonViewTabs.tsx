import { useRef, useState, type KeyboardEvent } from 'react';
import type { LessonView } from '../domain/types';

const tabs = [{ key: 'intuition', label: 'Intuition' }, { key: 'math', label: 'Math' }, { key: 'code', label: 'Code' }, { key: 'workConnection', label: 'Work connection' }] as const;
export function LessonViewTabs({ views }: { views: LessonView }) {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); setSelected(next); buttons.current[next]?.focus();
  }
  return <div className="lesson-views"><div role="tablist" aria-label="Ways to understand">{tabs.map((tab, index) => <button key={tab.key} ref={(node) => { buttons.current[index] = node; }} id={`view-tab-${tab.key}`} role="tab" type="button" aria-selected={selected === index} aria-controls={`view-panel-${tab.key}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={(event) => move(event, index)}>{tab.label}</button>)}</div>{tabs.map((tab, index) => <div key={tab.key} role="tabpanel" id={`view-panel-${tab.key}`} aria-labelledby={`view-tab-${tab.key}`} hidden={selected !== index} tabIndex={0}><p>{views[tab.key]}</p></div>)}</div>;
}
