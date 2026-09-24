import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboardPage from './AdminDashboardPage';
import { getSemilleros, getUnidades } from '../api/semillerosApi';
vi.mock('../api/semillerosApi', () => ({ getSemilleros: vi.fn(), getUnidades: vi.fn() }));
vi.mock('../components/DetailsModal', () => ({ default: () => null }));
const data = { contenido: [{ id: 1, nombre: 'Robótica', facultad: 'Ingeniería', campus: 'Medellín', estado: 'ACTIVO', totalSemilleristas: 12 }], totalElementos: 1, totalPaginas: 1, paginaActual: 0, esPrimeraPagina: true, esUltimaPagina: true, tamano: 6 };
describe('Panel administrativo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSemilleros).mockResolvedValue(data as Awaited<ReturnType<typeof getSemilleros>>);
    vi.mocked(getUnidades).mockResolvedValue([{ id: 1, nombre: 'Ingeniería', siglas: 'ING' }]);
  });
  it('muestra datos reales y mantiene deshabilitada la gestión pendiente', async () => {
    render(<AdminDashboardPage preview onLogout={() => {}} />);
    expect(await screen.findByText('Robótica')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo usuario' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar recordatorios' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Buscar semillero'), { target: { value: 'Robot' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Buscar' }).find(button => !button.hasAttribute('disabled') && !button.closest('fieldset'))!);
    await waitFor(() => expect(getSemilleros).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Robot' }), 0, 6));
  });
  it('muestra un error recuperable si falla la API', async () => {
    vi.mocked(getSemilleros).mockRejectedValue(new Error('offline'));
    render(<AdminDashboardPage onLogout={() => {}} />);
    expect(await screen.findByText(/No se pudieron cargar los semilleros/)).toBeInTheDocument();
    vi.mocked(getSemilleros).mockResolvedValue(data as Awaited<ReturnType<typeof getSemilleros>>);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Robótica')).toBeInTheDocument();
  });
});
