// Ensure window.fetch is writable and cannot throw getter-only errors
if (typeof window !== 'undefined') {
  try {
    let _nativeFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get() {
        return _nativeFetch;
      },
      set(fn) {
        _nativeFetch = fn;
      },
      configurable: true,
      enumerable: true,
    });
  } catch {
    // ignore if already defined
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
