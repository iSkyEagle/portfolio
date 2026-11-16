import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { App } from './App';
import './styles.css';

// Routage par ancre (#/page) : chaque page a une adresse partageable
// sans configuration côté serveur, ce que GitHub Pages ne permet pas.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
