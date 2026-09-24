import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { activarCuenta, verificarCorreo } from '../api/accesosApi';
import EnlaceAccesoPage from './EnlaceAccesoPage';

vi.mock('../api/accesosApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/accesosApi')>()),
  verificarCorreo: vi.fn(), activarCuenta: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());

it('confirma el correo al abrir el enlace', async () => {
  vi.mocked(verificarCorreo).mockResolvedValue('Correo confirmado. Un administrador revisará tu solicitud.');
  const irAlLogin = vi.fn();
  render(<EnlaceAccesoPage accion="verificar" token="t1" onIrAlLogin={irAlLogin} onVolver={() => {}} />);
  expect(await screen.findByText(/Correo confirmado/)).toBeInTheDocument();
  expect(verificarCorreo).toHaveBeenCalledTimes(1);
  expect(verificarCorreo).toHaveBeenCalledWith('t1');
  fireEvent.click(screen.getByRole('button', { name: 'Ir a Acceso SIGSI' }));
  expect(irAlLogin).toHaveBeenCalled();
});

it('no reenvía el token si la página se monta dos veces', async () => {
  vi.mocked(verificarCorreo).mockResolvedValue('Correo confirmado.');
  const vista = render(<EnlaceAccesoPage accion="verificar" token="t-doble" onIrAlLogin={() => {}} onVolver={() => {}} />);
  vista.unmount();
  render(<EnlaceAccesoPage accion="verificar" token="t-doble" onIrAlLogin={() => {}} onVolver={() => {}} />);
  expect(await screen.findByText('Correo confirmado.')).toBeInTheDocument();
  expect(verificarCorreo).toHaveBeenCalledTimes(1);
});

it('informa si el enlace de confirmación venció', async () => {
  vi.mocked(verificarCorreo).mockRejectedValue(new Error('El enlace no es válido o ya venció. Solicita uno nuevo.'));
  render(<EnlaceAccesoPage accion="verificar" token="viejo" onIrAlLogin={() => {}} onVolver={() => {}} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('ya venció');
  expect(screen.getByText(/envía la solicitud de nuevo/)).toBeInTheDocument();
});

it('activa la cuenta con una contraseña válida y confirmada', async () => {
  vi.mocked(activarCuenta).mockResolvedValue('Cuenta activada. Ya puedes iniciar sesión.');
  const irAlLogin = vi.fn();
  render(<EnlaceAccesoPage accion="activar" token="t2" onIrAlLogin={irAlLogin} onVolver={() => {}} />);
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'corta' } });
  fireEvent.click(screen.getByRole('button', { name: 'Activar mi cuenta' }));
  expect(screen.getByRole('alert')).toHaveTextContent('entre 10 y 72 caracteres');
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Semilleros2026' } });
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Semilleros2025' } });
  fireEvent.click(screen.getByRole('button', { name: 'Activar mi cuenta' }));
  expect(screen.getByRole('alert')).toHaveTextContent('no coinciden');
  expect(activarCuenta).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Semilleros2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Activar mi cuenta' }));
  await waitFor(() => expect(irAlLogin).toHaveBeenCalledWith('Cuenta activada. Ya puedes iniciar sesión.'));
  expect(activarCuenta).toHaveBeenCalledWith('t2', 'Semilleros2026');
});

it('muestra el error si el enlace de activación ya no sirve', async () => {
  vi.mocked(activarCuenta).mockRejectedValue(new Error('El enlace no es válido o ya venció. Solicita uno nuevo.'));
  render(<EnlaceAccesoPage accion="activar" token="usado" onIrAlLogin={() => {}} onVolver={() => {}} />);
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Semilleros2026' } });
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Semilleros2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Activar mi cuenta' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('ya venció');
});
