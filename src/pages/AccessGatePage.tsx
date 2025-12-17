import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ACCESS_UNLOCK_KEY = 'dashboard_access_unlocked';

const isGateEnabled = () =>
  (import.meta.env.VITE_ACCESS_GATE ?? '').toString().toLowerCase() === 'true';

const resolveNextPath = (search: string) => {
  const params = new URLSearchParams(search);
  const nextParam = params.get('next');

  if (!nextParam) return '/overview';
  if (!nextParam.startsWith('/')) return '/overview';
  if (nextParam.startsWith('//')) return '/overview';
  if (nextParam.startsWith('/access')) return '/overview';

  return nextParam;
};

const hasUnlocked = () => {
  try {
    return localStorage.getItem(ACCESS_UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
};

const storeUnlock = () => {
  try {
    localStorage.setItem(ACCESS_UNLOCK_KEY, 'true');
  } catch {
    // ignore storage errors (e.g. disabled cookies/storage)
  }
};

const AccessGatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const gateEnabled = isGateEnabled();
  const expectedCode = useMemo(
    () => (import.meta.env.VITE_ACCESS_CODE ?? '').toString(),
    []
  );
  const nextPath = resolveNextPath(location.search);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gateEnabled) {
      navigate('/overview', { replace: true });
      return;
    }

    if (hasUnlocked()) {
      navigate(nextPath, { replace: true });
    }
  }, [gateEnabled, navigate, nextPath]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const entered = code.trim();
    const expected = expectedCode.trim();

    if (!entered) {
      setError('Bitte Access Code eingeben.');
      return;
    }

    if (!expected || entered !== expected) {
      setError('Falscher Access Code.');
      return;
    }

    storeUnlock();
    navigate(nextPath, { replace: true });
  };

  if (!gateEnabled) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        <Card
          title="Zugangscode erforderlich"
          subtitle="Bitte gib den Access Code ein, um das Dashboard zu öffnen."
          className="ui-card-padded"
        >
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Access Code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="•••••••"
              autoFocus
              autoComplete="off"
              fullWidth
            />

            {error ? <div className="error-box">{error}</div> : null}

            <Button type="submit" variant="primary" fullWidth>
              Entsperren
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AccessGatePage;
