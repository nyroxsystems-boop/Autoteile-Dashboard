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
// This interceptor logs the call stack when React.createElement
// is called with `undefined` — identifying the exact source of
// React Error #130. REMOVE AFTER DEBUGGING.
const _origCreateElement = React.createElement;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(React as any).createElement = function (type: any, ...rest: any[]) {
  if (type === undefined) {
    console.error(
      '[DEBUG] React.createElement called with undefined component!',
      new Error().stack,
    );
  }
  return _origCreateElement.apply(this, [type, ...rest]);
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
