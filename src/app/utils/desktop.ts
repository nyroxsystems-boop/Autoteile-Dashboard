/**
 * Desktop-safe utility for opening external URLs.
 * In Electron: uses shell.openExternal via IPC
 * In browser: uses window.open
 */

// Check if running inside Electron
export function isElectron(): boolean {
    return typeof window !== 'undefined' &&
        typeof window.process === 'object' &&
        (window.process as NodeJS.Process)?.versions?.electron !== undefined;
}

/**
 * Open an external URL safely (works in browser + Electron/Tauri)
 */
export function openExternal(url: string): void {
    if (isElectron()) {
        // Electron: use IPC to open in system browser
        // This requires a preload script that exposes shell.openExternal
        const { ipcRenderer } = window.require?.('electron') ?? {};
        if (ipcRenderer) {
            ipcRenderer.send('open-external', url);
        } else {
            // Fallback for Electron without IPC setup
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    } else if ((window as unknown as Record<string, unknown>).__TAURI__) {
        // Tauri: use the shell API (requires @tauri-apps/api)
        // @ts-expect-error — Tauri API only available in Tauri context
        import('@tauri-apps/api/shell').then(({ open }: { open: (url: string) => Promise<void> }) => open(url)).catch(() => {
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    } else {
        // Browser: standard window.open
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

/**
 * Open a blob URL for preview (works in browser + Electron)
 */
export function openBlobPreview(blob: Blob): void {
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
}

/**
 * Open a print window for HTML content (works in browser + Electron)
 */
export function openPrintWindow(htmlContent: string, _title: string): boolean {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return false;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    return true;
}
