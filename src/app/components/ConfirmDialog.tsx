import { useState, useCallback, useRef, useEffect } from 'react';
import { useI18n } from '../../i18n';

interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Hook for showing custom confirm dialogs instead of window.confirm()
 * 
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirmDialog();
 *   const ok = await confirm({ title: '...', message: '...' });
 */
export function useConfirmDialog() {
    const { t } = useI18n();
    const [state, setState] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
    });

    const confirm = useCallback((opts: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: 'danger' | 'default';
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title: opts.title,
                message: opts.message,
                confirmLabel: opts.confirmLabel || t('confirm_yes') || 'Ja',
                cancelLabel: opts.cancelLabel || t('cancel') || 'Abbrechen',
                variant: opts.variant || 'default',
                onConfirm: () => {
                    setState((s) => ({ ...s, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setState((s) => ({ ...s, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, [t]);

    const ConfirmDialogComponent = () => {
        const dialogRef = useRef<HTMLDivElement>(null);

        // Focus trap: Escape key cancels
        useEffect(() => {
            if (!state.isOpen) return;
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    state.onCancel();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, [state.isOpen, state.onCancel]);

        if (!state.isOpen) return null;

        return (
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-in fade-in duration-200"
                onClick={(e) => { if (e.target === e.currentTarget) state.onCancel(); }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
            >
                <div ref={dialogRef} className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                    <div className="p-6">
                        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-foreground mb-2">{state.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{state.message}</p>
                    </div>
                    <div className="flex gap-3 px-6 pb-6">
                        <button
                            onClick={state.onCancel}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted/50 border border-border rounded-xl hover:bg-muted transition-colors"
                        >
                            {state.cancelLabel}
                        </button>
                        <button
                            onClick={state.onConfirm}
                            autoFocus
                            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${state.variant === 'danger'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                        >
                            {state.confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
