import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { getCaptcha, getUnidades } from '../api/semillerosApi';
import { solicitarAcceso } from '../api/accesosApi';
import SolicitudAccesoForm from './SolicitudAccesoForm';

vi.mock('../api/semillerosApi', () => ({ getCaptcha: vi.fn(), getUnidades: vi.fn() }));
vi.mock('../api/accesosApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/accesosApi')>()),
  solicitarAcceso: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCaptcha).mockResolvedValue({ operando1: 3, operando2: 4, operacion: 'SUMA', pregunta: '¿3 + 4?' });
  vi.mocked(getUnidades).mockResolvedValue([{ id: 1, nombre: 'Facultad de Ingeniería', siglas: 'FING' }]);
});

function llenar(correo = 'ana.zapata@udea.edu.co') {
  fireEvent.change(screen.getByLabelText('Nombres *'), { target: { value: ' Ana ' } });
  fireEvent.change(screen.getByLabelText('Apellidos *'), { target: { value: 'Zapata' } });
  fireEvent.change(screen.getByLabelText('Cédula *'), { target: { value: '1040-123456' } });
  fireEvent.change(screen.getByLabelText('Correo institucional *'), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText('Unidad académica'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('¿Qué semillero coordinas o coordinarás? *'), { target: { value: 'Coordino el semillero de robótica aplicada' } });
  fireEvent.change(screen.getByLabelText('Verificación anti-bot'), { target: { value: '7' } });
}

it('envía la solicitud con el captcha y muestra el mensaje genérico', async () => {
  vi.mocked(solicitarAcceso).mockResolvedValue('Si los datos son válidos, recibirás un correo.');
  render(<SolicitudAccesoForm onVolver={() => {}} />);
  await screen.findByText('3 + 4 = ?');
  expect(await screen.findByRole('option', { name: 'Facultad de Ingeniería' })).toBeInTheDocument();
  llenar();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

  await waitFor(() => expect(solicitarAcceso).toHaveBeenCalledWith({
    nombres: 'Ana', apellidos: 'Zapata', cedula: '1040123456', correo: 'ana.zapata@udea.edu.co', idUnidadAcademica: 1,
    justificacion: 'Coordino el semillero de robótica aplicada', sitioWeb: '', respuestaMath: 7, operando1: 3, operando2: 4,
  }));
  expect(await screen.findByRole('status')).toHaveTextContent('Revisa tu correo');
});

it('exige correo @udea.edu.co y datos completos antes de enviar', async () => {
  render(<SolicitudAccesoForm onVolver={() => {}} />);
  await screen.findByText('3 + 4 = ?');
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
  expect(screen.getByText('Ingrese sus nombres')).toBeInTheDocument();
  expect(screen.getByText(/entre 7 y 10 dígitos/)).toBeInTheDocument();
  llenar('ana@gmail.com');
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
  expect(screen.getByText('Use su correo institucional (@udea.edu.co)')).toBeInTheDocument();
  expect(solicitarAcceso).not.toHaveBeenCalled();
});

it('muestra el error del servidor y carga un captcha nuevo', async () => {
  vi.mocked(solicitarAcceso).mockRejectedValue(new Error('La validación matemática anti-bot no fue resuelta correctamente.'));
  render(<SolicitudAccesoForm onVolver={() => {}} />);
  await screen.findByText('3 + 4 = ?');
  llenar();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('anti-bot');
  expect(getCaptcha).toHaveBeenCalledTimes(2);
});

it('el campo trampa está oculto para las personas', async () => {
  const volver = vi.fn();
  render(<SolicitudAccesoForm onVolver={volver} />);
  await screen.findByText('3 + 4 = ?');
  expect(document.getElementById('sol-sitio')).toHaveAttribute('tabindex', '-1');
  expect(document.getElementById('sol-sitio')?.closest('.solicitud-trampa')).toHaveAttribute('aria-hidden', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Ya tengo cuenta, iniciar sesión' }));
  expect(volver).toHaveBeenCalled();
});
