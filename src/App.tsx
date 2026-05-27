import { useState } from 'react';
import type { LoginResponse } from './types';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CoordinadorHomePage from './pages/CoordinadorHomePage';
import CaracterizacionPage from './pages/CaracterizacionPage';

type View = 'home' | 'login' | 'coordinador' | 'caracterizacion';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [auth, setAuth] = useState<LoginResponse | null>(null);
  const [selectedSemilleroId, setSelectedSemilleroId] = useState<number | null>(null);

  function handleLoginSuccess(response: LoginResponse) {
    setAuth(response);
    setView('coordinador');
  }

  function handleLogout() {
    setAuth(null);
    setSelectedSemilleroId(null);
    setView('home');
  }

  function handleOpenSemillero(idSemillero: number) {
    setSelectedSemilleroId(idSemillero);
    setView('caracterizacion');
  }

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
        onBack={() => setView('coordinador')}
        onLogout={handleLogout}
      />
    );
  }

  return <HomePage onAccesoSigsi={() => setView('login')} />;
}
