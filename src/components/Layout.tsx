import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { sectionGuideByRoute, type SectionGuide, type SectionRoute } from '../content/section-guides';
import { PagePurpose } from './PagePurpose';

const navigation = Object.entries(sectionGuideByRoute) as [SectionRoute, SectionGuide][];
const mobileQuery = '(max-width: 900px)';
const iconPaths: Record<SectionGuide['icon'], ReactNode> = {
  today: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16m-12 5 2 2 5-5" /></>,
  book: <><path d="M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15" /></>,
  practice: <><path d="m4 16 12-12 4 4L8 20H4v-4Zm9-9 4 4M4 4h5M4 8h2" /></>,
  review: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6m2-4v6l4 2" /></>,
  lab: <><path d="M9 3h6m-5 0v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M7 15h10" /></>,
  progress: <><path d="M4 3v17h17M8 16v-4m5 4V8m5 8V5" /></>,
  notes: <><path d="M6 3h12v18H6zM9 7h6m-6 4h6m-6 4h4M3 7h3m-3 5h3m-3 5h3" /></>,
  settings: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="9" cy="18" r="2" /></>,
};

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia?.(mobileQuery).matches ?? false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const { pathname, key: locationKey } = useLocation();
  const route: SectionRoute = pathname.startsWith('/lesson/') ? '/curriculum'
    : Object.hasOwn(sectionGuideByRoute, pathname) ? pathname as SectionRoute : '/';
  const modalOpen = mobile && open;

  useEffect(() => {
    const query = window.matchMedia?.(mobileQuery);
    if (!query) return;
    const onChange = () => {
      setMobile(query.matches);
      setOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Also close for history changes and programmatic navigation.
  useEffect(() => { setOpen(false); }, [locationKey]);

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === 'Tab') {
        const items = drawerRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      menuRef.current?.focus();
    };
  }, [modalOpen]);

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content" inert={modalOpen}>Skip to content</a>
      <header className="mobile-header" inert={modalOpen}>
        <span className="brand-mark" aria-hidden="true">∂</span>
        <span>Deep Learning Companion</span>
        <button ref={menuRef} type="button" className="menu-button" aria-expanded={modalOpen} aria-controls="primary-navigation" onClick={() => setOpen(true)}>
          Menu
        </button>
      </header>
      {modalOpen ? <div className="navigation-backdrop" aria-hidden="true" onClick={() => setOpen(false)} /> : null}
      <aside ref={drawerRef} className={modalOpen ? 'sidebar sidebar--open' : 'sidebar'}
        role={modalOpen ? 'dialog' : undefined} aria-modal={modalOpen ? true : undefined}
        aria-label={modalOpen ? 'Sections' : undefined} aria-hidden={mobile && !open ? true : undefined}
        inert={mobile && !open}>
        {modalOpen ? <button type="button" className="drawer-close" onClick={() => setOpen(false)}>Close navigation</button> : null}
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">∂</span>
          <div><strong>Deep Learning</strong><span>companion notebook</span></div>
        </div>
        <nav id="primary-navigation" aria-label="Primary">
          {navigation.map(([to, guide]) => (
            <Link key={to} to={to} aria-label={guide.label}
              aria-describedby={`nav-description-${guide.icon}`}
              aria-current={route === to ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={route === to ? 'nav-link nav-link--active' : 'nav-link'}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[guide.icon]}</svg>
              <span className="nav-copy"><strong>{guide.label}</strong><small id={`nav-description-${guide.icon}`}>{guide.navDescription}</small></span>
            </Link>
          ))}
        </nav>
        <p className="local-note"><span aria-hidden="true">●</span> Progress stays in this browser</p>
      </aside>
      <main id="main-content" tabIndex={-1} inert={modalOpen}>
        <PagePurpose guide={sectionGuideByRoute[route]} />
        {children}
      </main>
    </div>
  );
}
