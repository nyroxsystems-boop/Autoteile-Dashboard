import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { I18nProvider } from './i18n'
import { ErrorBoundary } from './app/components/ErrorBoundary'
import { errorTracker } from './app/services/errorTracker'
import App from './app/App'
import './styles/index.css'

// Initialize error tracking before rendering
errorTracker.init();

// ─── TEMPORARY DEBUG: catch undefined components ───────────────
// Patch jsx/jsxs from react/jsx-runtime to find the undefined component
import * as JsxRuntime from 'react/jsx-runtime';
const origJsx = (JsxRuntime as any).jsx;
const origJsxs = (JsxRuntime as any).jsxs;
(JsxRuntime as any).jsx = function(type: any, ...args: any[]) {
  if (type === undefined) {
    console.error('[DEBUG] jsx() called with UNDEFINED component! Stack:', new Error().stack);
  }
  return origJsx.call(this, type, ...args);
};
(JsxRuntime as any).jsxs = function(type: any, ...args: any[]) {
  if (type === undefined) {
    console.error('[DEBUG] jsxs() called with UNDEFINED component! Stack:', new Error().stack);
  }
  return origJsxs.call(this, type, ...args);
};
// ─── END TEMPORARY DEBUG ───────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <I18nProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </I18nProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>,
)
