/**
 * Desktop-safe utilities for Electron/Tauri/Browser environments.
 * All window.open, window.location.reload, and external URL calls
 * should go through these functions.
 */

// Check if running inside Electron
export function isElectron(): boolean {
    return typeof window !== 'undefined' &&
        typeof window.process === 'object' &&
        (window.process as NodeJS.Process)?.versions?.electron !== undefined;
}

// Check if running inside Tauri
export function isTauri(): boolean {
    return typeof window !== 'undefined' &&
        !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

/**
 * Open an external URL safely (works in browser + Electron/Tauri)
 */
export function openExternal(url: string): void {
    if (isElectron()) {
        // Electron: use IPC to open in system browser
        const { ipcRenderer } = window.require?.('electron') ?? {};
        if (ipcRenderer) {
            ipcRenderer.send('open-external', url);
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    } else if (isTauri()) {
        // Tauri v2: use @tauri-apps/plugin-shell
        // Use variable to prevent Rollup from trying to resolve this at build time
        const tauriShellModule = '@tauri-apps/plugin-shell';
        import(/* @vite-ignore */ tauriShellModule).then((mod: { open: (url: string) => Promise<void> }) => mod.open(url)).catch(() => {
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    } else {
        // Browser: standard window.open
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

/**
 * Open a blob for preview.
 * In browser: opens in new tab. 
 * In Electron/Tauri: creates an embedded preview or downloads.
 */
export function openBlobPreview(blob: Blob): void {
    const blobUrl = window.URL.createObjectURL(blob);

    if (isElectron()) {
        // In Electron, new windows from blob URLs are unreliable.
        // Use a download link instead, which triggers native PDF viewer.
        triggerDownload(blobUrl, 'preview.pdf');
    } else {
        // Browser: new tab works fine
        window.open(blobUrl, '_blank');
    }

    // Revoke after a delay
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Print HTML content.
 * In browser: uses an iframe for reliable printing.
 * In Electron: uses webContents.print() via IPC if available.
 */
export function openPrintWindow(htmlContent: string): boolean {
    if (isElectron()) {
        const { ipcRenderer } = window.require?.('electron') ?? {};
        if (ipcRenderer) {
            ipcRenderer.invoke('print-html', htmlContent);
            return true;
        }
    }

    // Browser / Electron fallback: use hidden iframe for print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(iframe);
        return false;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Wait for content to render, then print
    setTimeout(() => {
        iframe.contentWindow?.print();
        // Clean up after printing
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 250);

    return true;
}

/**
 * Trigger a file download from a URL or blob URL
 */
export function triggerDownload(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Get the current page URL for logging purposes.
 * Returns a sanitized URL that works in all environments.
 */
export function getCurrentPageUrl(): string {
    try {
        const loc = window.location;
        // In Electron/Tauri, location might be file:// or tauri://
        // Return the pathname + hash which is always meaningful
        if (loc.protocol === 'file:' || loc.protocol === 'tauri:') {
            return loc.pathname + loc.hash;
        }
        return loc.href;
    } catch {
        return 'unknown';
    }
}

/**
 * Reload the application safely.
 * In desktop apps, this triggers a re-render instead of full process restart.
 */
export function safeReload(): void {
    // For now, window.location.reload() works in all environments
    // But in Electron, it only reloads the renderer, not the main process
    window.location.reload();
}
