import { Component, ErrorInfo, ReactNode } from 'react';
import { errorTracker } from '../services/errorTracker';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// i18n fallbacks — ErrorBoundary is a class component so we can't use useI18n()
// These are used as fallback when the i18n context isn't available
const FALLBACK_STRINGS = {
    de: { title: 'Etwas ist schiefgelaufen', desc: 'Ein unerwarteter Fehler ist aufgetreten.', retry: 'Erneut versuchen' },
    en: { title: 'Something went wrong', desc: 'An unexpected error occurred.', retry: 'Try again' },
};

function getStrings() {
    try {
        const lang = localStorage.getItem('language') || 'de';
        return FALLBACK_STRINGS[lang as keyof typeof FALLBACK_STRINGS] || FALLBACK_STRINGS.de;
    } catch {
        return FALLBACK_STRINGS.de;
    }
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
        errorTracker.capture(error, {
            componentStack: errorInfo.componentStack,
            source: 'ErrorBoundary',
        });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const strings = getStrings();

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-foreground font-semibold text-lg mb-2">{strings.title}</h3>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            {this.state.error?.message || strings.desc}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
                        >
                            {strings.retry}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
