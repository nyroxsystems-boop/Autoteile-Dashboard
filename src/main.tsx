import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { I18nProvider } from './i18n'
import { ErrorBoundary } from './app/components/ErrorBoundary'
import App from './app/App'
import './styles/index.css'

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
