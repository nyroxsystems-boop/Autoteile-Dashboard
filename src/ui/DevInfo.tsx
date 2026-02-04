import React from 'react';

const DevInfo: React.FC = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app';
    const mode = import.meta.env.MODE || 'development';
    const isDev = import.meta.env.DEV;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 10,
                right: 10,
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#00ff00',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'monospace',
                zIndex: 9999,
                border: '1px solid rgba(0, 255, 0, 0.3)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                maxWidth: 300,
                wordBreak: 'break-all'
            }}
        >
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#ffff00' }}>
                🔧 DEV MODE
            </div>
            <div style={{ marginBottom: 2 }}>
                <span style={{ color: '#888' }}>Mode:</span> {mode}
            </div>
            <div style={{ marginBottom: 2 }}>
                <span style={{ color: '#888' }}>Dev:</span> {isDev ? 'Yes' : 'No'}
            </div>
            <div>
                <span style={{ color: '#888' }}>API:</span> {apiBase}
            </div>
        </div>
    );
};

export default DevInfo;
