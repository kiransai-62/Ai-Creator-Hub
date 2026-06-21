import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './lib/ThemeContext'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'

// Define custom logging behavior: only show errors, and only to Admin users
const originalLog = console.log;
const originalWarn = console.warn;
const originalInfo = console.info;
const originalError = console.error;

const checkAdmin = () => {
  if ((window as any).__isAdmin === true) return true;
  if ((window as any).__isAdmin === false) return false;
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (key) {
      const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
      const user = sessionData?.user;
      if (user) {
        const email = user.email;
        const id = user.id;
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const adminUids = (import.meta.env.VITE_ADMIN_UIDS || '').split(',').map((s: string) => s.trim());
        if ((adminEmail && email === adminEmail) || adminUids.includes(id)) {
          (window as any).__isAdmin = true;
          return true;
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  (window as any).__isAdmin = false;
  return false;
};

console.log = (...args) => {
  if (checkAdmin()) {
    originalLog(...args);
  }
};

console.info = (...args) => {
  if (checkAdmin()) {
    originalInfo(...args);
  }
};

console.warn = (...args) => {
  if (checkAdmin()) {
    originalWarn(...args);
  }
};

console.error = (...args) => {
  // Only show errors, and only to Admin
  if (checkAdmin()) {
    originalError(...args);
  }
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </HelmetProvider>
    </BrowserRouter>
  </StrictMode>,
)
