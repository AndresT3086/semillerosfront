import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { LoginResponse } from './types';

// Las páginas se reemplazan por dobles mínimos: aquí solo se verifica la navegación por rol.
vi.mock('./pages/ReportsPage', () => ({
  default: ({ alcance, onBack }: { alcance: string; onBack: () => void }) => <div><h1>Reportes {alcance}</h1><button onClick={onBack}>Volver</button></div>,
}));
vi.mock('./pages/AdminDashboardPage', () => ({
  default: ({ onReports }: { onReports: () => void }) => <div><h1>Panel admin</h1><button onClick={onReports}>Reportes</button></div>,
}));
vi.mock('./pages/CoordinadorHomePage', () => ({
  default: ({ onReports, onOpenAsistencia }: { onReports: () => void; onOpenAsistencia: (id: number, nombre: string) => void }) =>
    <div><h1>Panel coordinador</h1><button onClick={onReports}>Ver estadísticas</button><button onClick={() => onOpenAsistencia(10, 'Semillero IA')}>Asistencia</button></div>,
}));
vi.mock('./pages/AsistenciaPage', () => ({
  default: ({ idSemillero, nombreSemillero, onBack }: { idSemillero: number; nombreSemillero: string; onBack: () => void }) =>
    <div><h1>Asistencia {idSemillero} {nombreSemillero}</h1><button onClick={onBack}>Volver</button></div>,
}));
vi.mock('./pages/HomePage', () => ({ default: () => <h1>Portal</h1> }));
vi.mock('./pages/CaracterizacionPage', () => ({ default: () => <h1>Caracterización</h1> }));
vi.mock('./pages/EnlaceAccesoPage', () => ({
  default: ({ accion, token, onIrAlLogin }: { accion: string; token: string; onIrAlLogin: (aviso?: string) => void }) =>
    <div><h1>Enlace {accion} {token}</h1><button onClick={() => onIrAlLogin('Cuenta activada.')}>Continuar</button></div>,
}));
vi.mock('./pages/LoginPage', () => ({
  default: ({ onLoginSuccess, aviso }: { onLoginSuccess: (response: LoginResponse) => void; aviso?: string | null }) =>
    <><p>{aviso}</p><button onClick={() => onLoginSuccess({ token: token('ADMIN'), tipo: 'Bearer', correo: 'yiyi.lopez@udea.edu.co', idUsuario: 6 })}>Ingresar</button></>,
}));

function token(rol: string) {
  return `h.${btoa(JSON.stringify({ rol })).replace(/=+$/, '')}.s`;
}

function iniciarSesion(rol: string) {
  sessionStorage.setItem('sigsi_auth', JSON.stringify({ token: token(rol), tipo: 'Bearer', correo: 'u@udea.edu.co', idUsuario: 1 }));
  sessionStorage.setItem('sigsi_last_activity', Date.now().toString());
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('Navegación de reportes por rol (HU12, HU15)', () => {
  it('sin sesión, la URL de reportes lleva al login y luego a los reportes del rol (RN52, RN54)', () => {
    window.history.replaceState(null, '', '/?vista=reportes&periodo=2025');
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Inicia sesión para consultar los reportes.');
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(screen.getByRole('heading', { name: 'Reportes ADMIN' })).toBeInTheDocument();
    expect(window.location.search).toContain('vista=reportes');
  });

  it('el administrador entra a reportes desde la barra superior y vuelve a su panel', () => {
    iniciarSesion('ADMIN');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Reportes' }));
    expect(screen.getByRole('heading', { name: 'Reportes ADMIN' })).toBeInTheDocument();
    expect(window.location.search).toBe('?vista=reportes');
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { name: 'Panel admin' })).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });

  it('el coordinador ve los reportes de sus semilleros y conserva la vista al recargar', () => {
    iniciarSesion('COORDINADOR');
    const view = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver estadísticas' }));
    expect(screen.getByRole('heading', { name: 'Reportes COORDINADOR' })).toBeInTheDocument();
    view.unmount();
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Reportes COORDINADOR' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { name: 'Panel coordinador' })).toBeInTheDocument();
  });

  it('el coordinador abre la asistencia de un semillero y vuelve a su panel', () => {
    iniciarSesion('COORDINADOR');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Asistencia' }));
    expect(screen.getByRole('heading', { name: 'Asistencia 10 Semillero IA' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { name: 'Panel coordinador' })).toBeInTheDocument();
  });

  it('los reportes no son públicos: sin sesión la URL de reportes pide iniciar sesión', () => {
    window.history.replaceState(null, '', '/?vista=estadisticas');
    const view = render(<App />);
    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument();
    view.unmount();
    window.history.replaceState(null, '', '/?vista=reportes');
    render(<App />);
    expect(screen.queryByRole('heading', { name: /Reportes/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('abre los enlaces del correo, quita el token de la URL y lleva al login con el aviso', () => {
    window.history.replaceState(null, '', '/?accion=activar&token=abc123');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Enlace activar abc123' })).toBeInTheDocument();
    expect(window.location.search).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Cuenta activada.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });
});
