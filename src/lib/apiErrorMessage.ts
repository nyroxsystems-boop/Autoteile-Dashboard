import type { ApiError } from '../api/types';

export const getFriendlyApiErrorMessage = (error: unknown): string => {
  const maybeApiError = error as Partial<ApiError> & { status?: unknown };
  const status = typeof maybeApiError?.status === 'number' ? maybeApiError.status : undefined;

  if (status === 401 || status === 403) {
    return 'Nicht berechtigt oder Token ungültig';
  }

  if (typeof status === 'number' && status >= 500) {
    return 'Backend aktuell nicht erreichbar';
  }

  if (status === undefined) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network error') ||
        msg.includes('timeout') ||
        msg.includes('load failed')
      ) {
        return 'Backend aktuell nicht erreichbar';
      }
    }
    return 'Backend aktuell nicht erreichbar';
  }

  return 'Fehler beim Laden';
};

