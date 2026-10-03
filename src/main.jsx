import React from 'react';
import { createRoot } from 'react-dom/client';
import Admin from './pages/Admin';
import './styles.css';
import './admin-ui.css';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Admin />
  </React.StrictMode>,
);
