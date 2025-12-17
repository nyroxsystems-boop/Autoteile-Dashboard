import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ACCESS_UNLOCK_KEY = 'dashboard_access_unlocked';

const isGateEnabled = () =>
  (import.meta.env.VITE_ACCESS_GATE ?? '').toString().toLowerCase() === 'true';

const isUnlocked = () => {
  try {
    return localStorage.getItem(ACCESS_UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
};

type RequireAccessProps = {
  children: React.ReactNode;
};

const RequireAccess: React.FC<RequireAccessProps> = ({ children }) => {
  const location = useLocation();

  if (!isGateEnabled()) return <>{children}</>;
  if (isUnlocked()) return <>{children}</>;

  const next = `${location.pathname}${location.search}`;
  const params = new URLSearchParams({ next });
  return <Navigate to={`/access?${params.toString()}`} replace />;
};

export default RequireAccess;

