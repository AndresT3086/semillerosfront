import { useEffect, useState } from 'react';
import { aprobarSolicitud, getSolicitudesAcceso, rechazarSolicitud, type SolicitudAcceso } from '../../api/accesosApi';

const fecha = (valor?: string) => valor ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// Solicitudes de acceso con el correo ya confirmado: el administrador decide si concede el acceso.
export default function SolicitudesAccesoPanel({ token, onPendientes }: { token: string; onPendientes?: (total: number) => void }) {
  const [recarga, setRecarga] = useState(0);
  const [estado, setEstado] = useState<{ recarga: number; solicitudes: SolicitudAcceso[]; error: boolean } | null>(null);
  const [rechazando, setRechazando] = useState<{ id: number; motivo: string; bloquear: boolean } | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const cargando = estado?.recarga !== recarga;
  const solicitudes = estado?.solicitudes ?? [];

  useEffect(() => {
    let activo = true;
    getSolicitudesAcceso(token)
      .then(lista => { if (activo) { setEstado({ recarga, solicitudes: lista, error: false }); onPendientes?.(lista.length); } })
      .catch(() => { if (activo) setEstado(previo => ({ recarga, solicitudes: previo?.solicitudes ?? [], error: true })); });
    return () => { activo = false; };
  }, [token, recarga, onPendientes]);

  function ejecutar(id: number, accion: Promise<string>) {
    setProcesando(id);
    setMensaje(null);
    accion
      .then(texto => { setMensaje({ ok: true, texto }); setRechazando(null); setRecarga(v => v + 1); })
      .catch((err: Error) => setMensaje({ ok: false, texto: err.message }))
      .finally(() => setProcesando(null));
  }

  function aprobar(solicitud: SolicitudAcceso) {
    if (!window.confirm(`¿Aprobar el acceso de ${solicitud.nombres} ${solicitud.apellidos} (${solicitud.correo}) como coordinador?`)) return;
    ejecutar(solicitud.id, aprobarSolicitud(solicitud.id, token));
  }

  return <section className="admin-card" aria-labelledby="solicitudes-acceso">
    <div className="admin-section-heading">
      <h2 id="solicitudes-acceso"><i className="bi bi-person-check" aria-hidden="true" />Solicitudes de acceso de coordinadores</h2>
      <span className="admin-badge">{cargando && !estado ? '…' : `${solicitudes.length} pendientes`}</span>
    </div>
    <p className="small text-muted">Solo aparecen solicitudes con el correo institucional confirmado. Al aprobar, la persona recibe un enlace para crear su contraseña.</p>
    {mensaje && <div className={`alert ${mensaje.ok ? 'alert-success' : 'alert-danger'} py-2 small`} role={mensaje.ok ? 'status' : 'alert'}>{mensaje.texto}</div>}
    {estado?.error && !cargando && <div className="alert alert-warning py-2 small" role="alert">No se pudieron cargar las solicitudes.<button className="btn btn-link btn-sm" onClick={() => setRecarga(v => v + 1)}>Reintentar</button></div>}
    {cargando && !estado ? <p role="status" className="admin-loading">Cargando solicitudes…</p>
      : !solicitudes.length ? <p className="text-muted mb-0">No hay solicitudes pendientes de revisión.</p>
        : <ul className="admin-semillero-list">{solicitudes.map(s => <li key={s.id} className="flex-wrap">
          <div className="admin-tree"><i className="bi bi-person-badge" aria-hidden="true" /></div>
          <div className="admin-semillero-info">
            <h3>{s.nombres} {s.apellidos}</h3>
            <p>{s.correo} · C.C. {s.cedula}{s.unidadAcademica ? ` · ${s.unidadAcademica}` : ''}</p>
            <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{s.justificacion}</p>
            <span className="small text-muted">Correo confirmado: {fecha(s.fechaVerificacion)}</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-udea btn-sm mt-0" disabled={procesando !== null} onClick={() => aprobar(s)} aria-label={`Aprobar a ${s.nombres} ${s.apellidos}`}>
              {procesando === s.id && !rechazando ? 'Aprobando…' : 'Aprobar'}
            </button>
            <button className="btn btn-outline-danger btn-sm" disabled={procesando !== null} onClick={() => setRechazando({ id: s.id, motivo: '', bloquear: false })} aria-label={`Rechazar a ${s.nombres} ${s.apellidos}`}>Rechazar</button>
          </div>
          {rechazando?.id === s.id && <form className="w-100 mt-3 p-3 rounded" style={{ background: '#fff8e1' }} onSubmit={event => {
            event.preventDefault();
            ejecutar(s.id, rechazarSolicitud(s.id, rechazando.motivo.trim(), rechazando.bloquear, token));
          }}>
            <label htmlFor={`motivo-${s.id}`} className="form-label small fw-semibold">Motivo del rechazo (se enviará a la persona)</label>
            <textarea id={`motivo-${s.id}`} className="form-control mb-2" rows={2} maxLength={500} required value={rechazando.motivo}
              onChange={e => setRechazando({ ...rechazando, motivo: e.target.value })} />
            <div className="form-check mb-2">
              <input id={`bloquear-${s.id}`} type="checkbox" className="form-check-input" checked={rechazando.bloquear}
                onChange={e => setRechazando({ ...rechazando, bloquear: e.target.checked })} />
              <label htmlFor={`bloquear-${s.id}`} className="form-check-label small">Bloquear este correo y cédula (no podrá volver a solicitar). Sin marcar, podrá intentarlo de nuevo en 30 días.</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-danger btn-sm" disabled={!rechazando.motivo.trim() || procesando !== null}>Confirmar rechazo</button>
              <button type="button" className="btn btn-link btn-sm" onClick={() => setRechazando(null)}>Cancelar</button>
            </div>
          </form>}
        </li>)}</ul>}
  </section>;
}
