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
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (key) {
      const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
      const user = sessionData?.user;
      if (user) {
        const email = user.email;
        const id = user.id;
        const ADMIN_EMAIL = 'sunnykiran715@gmail.com';
        const ADMIN_UIDS = ['770ee842-c7db-4f8c-9acc-7d0bfa26bebb', '44f703ec-2336-497c-8f0f-79ce9b8a59be'];
        if (email === ADMIN_EMAIL || ADMIN_UIDS.includes(id)) {
          (window as any).__isAdmin = true;
          return true;
        }
      }
    }
  } catch (e) {
    // Ignore
  }
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
