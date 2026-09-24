import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aprobarSolicitud, getSolicitudesAcceso, invitarCoordinador, rechazarSolicitud, type SolicitudAcceso } from '../../api/accesosApi';
import SolicitudesAccesoPanel from './SolicitudesAccesoPanel';
import InvitarCoordinadorForm from './InvitarCoordinadorForm';

vi.mock('../../api/accesosApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../../api/accesosApi')>()),
  getSolicitudesAcceso: vi.fn(), aprobarSolicitud: vi.fn(), rechazarSolicitud: vi.fn(), invitarCoordinador: vi.fn(),
}));

const solicitud: SolicitudAcceso = {
  id: 5, nombres: 'Laura', apellidos: 'Gómez', cedula: '1040555555', correo: 'laura.gomez@udea.edu.co',
  unidadAcademica: 'Facultad de Ingeniería', justificacion: 'Coordino el semillero de robótica', estado: 'PENDIENTE',
  fechaCreacion: '2026-09-24T15:00:00Z', fechaVerificacion: '2026-09-24T15:10:00Z', bloqueada: false,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSolicitudesAcceso).mockResolvedValue([solicitud]);
});
afterEach(() => vi.restoreAllMocks());

describe('SolicitudesAccesoPanel', () => {
  it('lista las pendientes, informa el total y aprueba tras confirmar', async () => {
    const onPendientes = vi.fn();
    vi.mocked(aprobarSolicitud).mockResolvedValue({ mensaje: 'Solicitud aprobada. Se envió el enlace de activación.', correoEnviado: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<SolicitudesAccesoPanel token="tok" onPendientes={onPendientes} />);
    expect(await screen.findByText('Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText(/laura.gomez@udea.edu.co · C.C. 1040555555 · Facultad de Ingeniería/)).toBeInTheDocument();
    expect(onPendientes).toHaveBeenCalledWith(1);
    vi.mocked(getSolicitudesAcceso).mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar a Laura Gómez' }));
    expect(await screen.findByText(/Solicitud aprobada/)).toBeInTheDocument();
    expect(aprobarSolicitud).toHaveBeenCalledWith(5, 'tok');
    expect(await screen.findByText('No hay solicitudes pendientes de revisión.')).toBeInTheDocument();
    expect(onPendientes).toHaveBeenLastCalledWith(0);
  });

  it('rechaza con motivo y opción de bloqueo', async () => {
    vi.mocked(rechazarSolicitud).mockResolvedValue('Solicitud rechazada.');
    render(<SolicitudesAccesoPanel token="tok" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Rechazar a Laura Gómez' }));
    const confirmar = screen.getByRole('button', { name: 'Confirmar rechazo' });
    expect(confirmar).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Motivo del rechazo/), { target: { value: ' No coordina semilleros ' } });
    fireEvent.click(screen.getByLabelText(/Bloquear este correo/));
    fireEvent.click(confirmar);
    await waitFor(() => expect(rechazarSolicitud).toHaveBeenCalledWith(5, 'No coordina semilleros', true, 'tok'));
  });

  it('no aprueba si el administrador cancela y muestra errores del servidor', async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.mocked(aprobarSolicitud).mockRejectedValue(new Error('Ya existe una cuenta con el correo de esta solicitud.'));
    render(<SolicitudesAccesoPanel token="tok" />);
    const aprobar = await screen.findByRole('button', { name: 'Aprobar a Laura Gómez' });
    fireEvent.click(aprobar);
    expect(aprobarSolicitud).not.toHaveBeenCalled();
    fireEvent.click(aprobar);
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta');
  });

  it('advierte cuando la solicitud se aprobó pero el correo no salió', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(aprobarSolicitud).mockResolvedValue({ mensaje: 'La solicitud quedó aprobada, pero no se pudo enviar el correo de activación.', correoEnviado: false });
    render(<SolicitudesAccesoPanel token="tok" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Aprobar a Laura Gómez' }));
    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('no se pudo enviar el correo de activación');
    expect(aviso).toHaveClass('alert-warning');
  });
});

describe('InvitarCoordinadorForm', () => {
  it('solo invita correos @udea.edu.co y confirma el envío', async () => {
    vi.mocked(invitarCoordinador).mockResolvedValue({ mensaje: 'Invitación enviada.', correoEnviado: true });
    render(<InvitarCoordinadorForm token="tok" />);
    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Pedro' } });
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Ruiz' } });
    fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value: 'pedro@gmail.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Solo se puede invitar a correos @udea.edu.co');
    expect(invitarCoordinador).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value: ' Pedro.Ruiz@udea.edu.co ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
    await waitFor(() => expect(invitarCoordinador).toHaveBeenCalledWith({ nombres: 'Pedro', apellidos: 'Ruiz', correo: 'pedro.ruiz@udea.edu.co' }, 'tok'));
    expect(within(screen.getByRole('status')).getByText(/Invitación enviada. pedro.ruiz@udea.edu.co tiene 24 horas/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nombres')).toHaveValue('');
  });

  it('exige nombres y muestra conflictos del servidor', async () => {
    vi.mocked(invitarCoordinador).mockRejectedValue(new Error('Ya existe una cuenta activa con ese correo.'));
    render(<InvitarCoordinadorForm token="tok" />);
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ingrese nombres y apellidos');
    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Laura' } });
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Gómez' } });
    fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value: 'laura.gomez@udea.edu.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta activa');
  });

  it('advierte si el correo no salió y conserva los datos para reintentar', async () => {
    vi.mocked(invitarCoordinador).mockResolvedValue({ mensaje: 'La invitación quedó registrada, pero no se pudo enviar el correo.', correoEnviado: false });
    render(<InvitarCoordinadorForm token="tok" />);
    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Pedro' } });
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Ruiz' } });
    fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value: 'pedro.ruiz@udea.edu.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('no se pudo enviar el correo');
    expect(aviso).toHaveClass('alert-warning');
    expect(screen.queryByText(/tiene 24 horas/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Correo institucional')).toHaveValue('pedro.ruiz@udea.edu.co');
  });
});
