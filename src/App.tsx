import { useEffect, useState } from 'react';
import type { LoginResponse } from './types';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CoordinadorHomePage from './pages/CoordinadorHomePage';
import CaracterizacionPage from './pages/CaracterizacionPage';

type View = 'home' | 'login' | 'coordinador' | 'caracterizacion';

const AUTH_STORAGE_KEY = 'sigsi_auth';
const SELECTED_SEMILLERO_KEY = 'sigsi_selected_semillero';
const LAST_ACTIVITY_KEY = 'sigsi_last_activity';
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

function clearStoredSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(SELECTED_SEMILLERO_KEY);
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

function readStoredAuth(): LoginResponse | null {
  try {
    const rawAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));

    if (!rawAuth || !lastActivity || Date.now() - lastActivity > INACTIVITY_LIMIT_MS) {
      clearStoredSession();
      return null;
    }

    return JSON.parse(rawAuth) as LoginResponse;
  } catch {
    clearStoredSession();
    return null;
  }
}

function readStoredSemilleroId() {
  const rawId = sessionStorage.getItem(SELECTED_SEMILLERO_KEY);
  if (!rawId) return null;
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function App() {
  const [auth, setAuth] = useState<LoginResponse | null>(() => readStoredAuth());
  const [selectedSemilleroId, setSelectedSemilleroId] = useState<number | null>(() => readStoredSemilleroId());
  const [view, setView] = useState<View>(() => {
    const storedAuth = readStoredAuth();
    if (!storedAuth) return 'home';
    return readStoredSemilleroId() != null ? 'caracterizacion' : 'coordinador';
  });
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  function handleLoginSuccess(response: LoginResponse) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    sessionStorage.removeItem(SELECTED_SEMILLERO_KEY);
    setAuth(response);
    setSelectedSemilleroId(null);
    setSessionMessage(null);
    setView('coordinador');
  }

  function handleLogout(message?: string) {
    clearStoredSession();
    setAuth(null);
    setSelectedSemilleroId(null);
    setSessionMessage(message ?? null);
    setView('home');
  }

  function handleOpenSemillero(idSemillero: number) {
    sessionStorage.setItem(SELECTED_SEMILLERO_KEY, idSemillero.toString());
    setSelectedSemilleroId(idSemillero);
    setView('caracterizacion');
  }

  function handleBackToCoordinador() {
    sessionStorage.removeItem(SELECTED_SEMILLERO_KEY);
    setSelectedSemilleroId(null);
    setView('coordinador');
  }

  useEffect(() => {
    if (!auth) return undefined;

    let timeoutId: number;
    const refreshActivity = () => {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleLogout('Sesión cerrada por inactividad.');
      }, INACTIVITY_LIMIT_MS);
    };

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(eventName => window.addEventListener(eventName, refreshActivity, { passive: true }));
    refreshActivity();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(eventName => window.removeEventListener(eventName, refreshActivity));
    };
  }, [auth]);

  if (view === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setView('home')} />;
  }

  if (view === 'coordinador' && auth) {
    return (
      <CoordinadorHomePage
        token={auth.token}
        correoCoordinador={auth.correo}
        onLogout={handleLogout}
        onOpenSemillero={handleOpenSemillero}
      />
    );
  }

  if (view === 'caracterizacion' && auth && selectedSemilleroId != null) {
    return (
      <CaracterizacionPage
        token={auth.token}
        correoCoordinador={auth.correo}
        semilleroId={selectedSemilleroId}
        onBack={handleBackToCoordinador}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      {sessionMessage && (
        <div className="alert alert-warning m-3 mb-0" role="alert">
          <i className="bi bi-clock-history me-2"></i>{sessionMessage}
        </div>
      )}
      <HomePage onAccesoSigsi={() => setView('login')} />
    </>
  );
}
