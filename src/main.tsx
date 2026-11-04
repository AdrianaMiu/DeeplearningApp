import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { AppShell } from './App';
import { UpdateNotice } from './components/UpdateNotice';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <UpdateNotice />
      <AppShell />
    </HashRouter>
  </StrictMode>,
);
