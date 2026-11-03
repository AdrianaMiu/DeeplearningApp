import { useState } from 'react';
import { useAppData } from '../app/context';

export default function Notes() {
  const { repository, snapshot, refresh } = useAppData();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  async function save() { const now = new Date().toISOString(); await repository.saveNote({ id: crypto.randomUUID(), title, body, tags: [], createdAt: now, updatedAt: now }); setTitle(''); setBody(''); refresh(); }
  return <div className="page"><header className="page-heading"><p className="eyebrow">Local notebook</p><h1>Notes in your own words</h1><p>Nothing here leaves this browser unless you explicitly export it.</p></header><div className="two-column notes-layout"><section className="paper-card"><h2>New note</h2><label>Note title<input name="note-title" autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Note body<textarea name="note-body" autoComplete="off" rows={7} value={body} onChange={(event) => setBody(event.target.value)} /></label><button className="button button--primary" disabled={!title.trim() || !body.trim()} onClick={save}>Save note</button></section><section aria-live="polite"><h2>Saved notes</h2>{snapshot?.notes.length ? snapshot.notes.slice().reverse().map((note) => <article className="note-card" key={note.id}><h3>{note.title}</h3><p>{note.body}</p></article>) : <p className="empty-state">Your first teach-back, question, or correction can live here.</p>}</section></div></div>;
}
