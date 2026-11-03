import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const navigation = [
  ['/', 'Today'],
  ['/curriculum', 'Curriculum'],
  ['/practice', 'Practice'],
  ['/review', 'Review'],
  ['/lab', 'Lab'],
  ['/progress', 'Progress'],
  ['/notes', 'Notes'],
  ['/settings', 'Settings'],
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="mobile-header">
        <span className="brand-mark" aria-hidden="true">∂</span>
        <span>Deep Learning Companion</span>
        <button className="menu-button" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Menu'}
        </button>
      </header>
      <aside className={open ? 'sidebar sidebar--open' : 'sidebar'}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">∂</span>
          <div><strong>Deep Learning</strong><span>companion notebook</span></div>
        </div>
        <nav id="primary-navigation" aria-label="Primary">
          {navigation.map(([to, label], index) => (
            <NavLink
              key={to}
              to={to}
              end={index === 0}
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{label}
            </NavLink>
          ))}
        </nav>
        <p className="local-note"><span aria-hidden="true">●</span> Progress stays in this browser</p>
      </aside>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>
  );
}
