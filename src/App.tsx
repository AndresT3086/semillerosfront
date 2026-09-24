import { useEffect, useState } from 'react';
import type { LoginResponse } from './types';
import HomePage from './pages/HomePage';
import ReportsPage from './pages/ReportsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { clearReportFilters } from './reports/filters';
import { isAdminToken } from './auth/role';
import LoginPage from './pages/LoginPage';
import CoordinadorHomePage from './pages/CoordinadorHomePage';
import CaracterizacionPage from './pages/CaracterizacionPage';
import AsistenciaPage from './pages/AsistenciaPage';

type View = 'home' | 'login' | 'coordinador' | 'caracterizacion' | 'admin' | 'reportes' | 'estadisticas' | 'asistencia';

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

// HU15: las vistas de reportes tienen URL propia (?vista=reportes o ?vista=estadisticas)
// para poder recargarlas o compartirlas; las demás vistas no dejan rastro en la URL.
function readVistaUrl() {
  return new URLSearchParams(window.location.search).get('vista');
}

function writeVistaUrl(vista: 'reportes' | 'estadisticas' | null) {
  const params = new URLSearchParams(window.location.search);
  if (vista) params.set('vista', vista); else params.delete('vista');
  const query = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
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
    const vista = readVistaUrl();
    if (vista === 'estadisticas') return 'estadisticas';
    // RN54: sin sesión activa, la URL de reportes lleva al inicio de sesión
    if (!storedAuth) return vista === 'reportes' ? 'login' : 'home';
    if (vista === 'reportes') return 'reportes';
    if (isAdminToken(storedAuth.token)) return 'admin';
    return readStoredSemilleroId() != null ? 'caracterizacion' : 'coordinador';
  });
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [semilleroAsistencia, setSemilleroAsistencia] = useState<{ id: number; nombre: string } | null>(null);
  const [reportesTrasLogin, setReportesTrasLogin] = useState(() => readVistaUrl() === 'reportes' && !readStoredAuth());

  function openReports() {
    writeVistaUrl('reportes');
    setView('reportes');
  }

  function leaveReports(next: View) {
    clearReportFilters();
    writeVistaUrl(null);
    setView(next);
  }

  function handleLoginSuccess(response: LoginResponse) {
    clearReportFilters();
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    sessionStorage.removeItem(SELECTED_SEMILLERO_KEY);
    setAuth(response);
    setSelectedSemilleroId(null);
    setSessionMessage(null);
    // RN52: si venía de la URL de reportes, entra a los reportes de su rol
    if (reportesTrasLogin) {
      setReportesTrasLogin(false);
      openReports();
      return;
    }
    setView(isAdminToken(response.token) ? 'admin' : 'coordinador');
  }

  function handleLogout(message?: string) {
    clearReportFilters();
    writeVistaUrl(null);
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

  // HU12: el mismo tablero con el alcance del rol del token; el backend valida el rol (RN42).
  if (view === 'reportes' && auth) {
    const esAdmin = isAdminToken(auth.token);
    return <ReportsPage alcance={esAdmin ? 'ADMIN' : 'COORDINADOR'} token={auth.token} correo={auth.correo}
      onBack={() => leaveReports(esAdmin ? 'admin' : 'coordinador')} onLogout={() => handleLogout()} />;
  }

  if (view === 'estadisticas') {
    return <ReportsPage alcance="PUBLICO" backLabel="← Volver al portal" onBack={() => leaveReports(auth ? (isAdminToken(auth.token) ? 'admin' : 'coordinador') : 'home')} />;
  }

  if (view === 'admin' && auth && isAdminToken(auth.token)) {
    return <AdminDashboardPage onReports={openReports} correo={auth.correo} onLogout={() => handleLogout()} />;
  }

  if (view === 'login') {
    return (
      <>
        {reportesTrasLogin && (
          <div className="alert alert-info m-3 mb-0" role="status">
            <i className="bi bi-lock me-2"></i>Inicia sesión para consultar los reportes.
          </div>
        )}
        <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => { setReportesTrasLogin(false); leaveReports('home'); }} />
      </>
    );
  }

  if (view === 'coordinador' && auth) {
    return (
      <CoordinadorHomePage
        token={auth.token}
        correoCoordinador={auth.correo}
        onLogout={handleLogout}
        onOpenSemillero={handleOpenSemillero}
        onReports={openReports}
        onOpenAsistencia={(id, nombre) => { setSemilleroAsistencia({ id, nombre }); setView('asistencia'); }}
      />
    );
  }

  if (view === 'asistencia' && auth && semilleroAsistencia) {
    return (
      <AsistenciaPage
        token={auth.token}
        correo={auth.correo}
        idSemillero={semilleroAsistencia.id}
        nombreSemillero={semilleroAsistencia.nombre}
        onBack={() => { setSemilleroAsistencia(null); setView('coordinador'); }}
        onLogout={handleLogout}
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
      <HomePage onAccesoSigsi={() => setView('login')} onEstadisticas={() => { writeVistaUrl('estadisticas'); setView('estadisticas'); }} />
    </>
  );
}
