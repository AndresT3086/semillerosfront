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
  default: ({ onReports }: { onReports: () => void }) => <div><h1>Panel coordinador</h1><button onClick={onReports}>Ver estadísticas</button></div>,
}));
vi.mock('./pages/HomePage', () => ({
  default: ({ onEstadisticas }: { onEstadisticas: () => void }) => <div><h1>Portal</h1><button onClick={onEstadisticas}>Estadísticas</button></div>,
}));
vi.mock('./pages/CaracterizacionPage', () => ({ default: () => <h1>Caracterización</h1> }));
vi.mock('./pages/LoginPage', () => ({
  default: ({ onLoginSuccess }: { onLoginSuccess: (response: LoginResponse) => void }) =>
    <button onClick={() => onLoginSuccess({ token: token('ADMIN'), tipo: 'Bearer', correo: 'yiyi.lopez@udea.edu.co', idCoordinador: 6 })}>Ingresar</button>,
}));

function token(rol: string) {
  return `h.${btoa(JSON.stringify({ rol })).replace(/=+$/, '')}.s`;
}

function iniciarSesion(rol: string) {
  sessionStorage.setItem('sigsi_auth', JSON.stringify({ token: token(rol), tipo: 'Bearer', correo: 'u@udea.edu.co', idCoordinador: 1 }));
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

  it('el portal público muestra estadísticas agregadas sin iniciar sesión', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Estadísticas' }));
    expect(screen.getByRole('heading', { name: 'Reportes PUBLICO' })).toBeInTheDocument();
    expect(window.location.search).toBe('?vista=estadisticas');
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument();
  });
});
