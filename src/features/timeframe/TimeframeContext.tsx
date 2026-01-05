import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Timeframe = 'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr';

interface TimeframeContextType {
    timeframe: Timeframe;
    setTimeframe: (timeframe: Timeframe) => void;
}

const TimeframeContext = createContext<TimeframeContextType | undefined>(undefined);

export function TimeframeProvider({ children }: { children: ReactNode }) {
    const [timeframe, setTimeframe] = useState<Timeframe>('Heute');

    return (
        <TimeframeContext.Provider value={{ timeframe, setTimeframe }}>
            {children}
        </TimeframeContext.Provider>
    );
}

export function useTimeframe() {
    const context = useContext(TimeframeContext);
    if (!context) {
        throw new Error('useTimeframe must be used within a TimeframeProvider');
    }
    return context;
}
