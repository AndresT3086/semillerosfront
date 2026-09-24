import { useState, type FormEvent } from 'react';
import { DOMINIO_INSTITUCIONAL, esCorreoInstitucional, invitarCoordinador } from '../../api/accesosApi';

const VACIO = { nombres: '', apellidos: '', correo: '' };
const CLASE_MENSAJE = { ok: 'alert-success', aviso: 'alert-warning', error: 'alert-danger' } as const;

// Invitación directa a un coordinador: solo correos institucionales. Si la persona ya fue
// invitada y no ha activado su cuenta, se reenvía el enlace (el anterior deja de servir).
export default function InvitarCoordinadorForm({ token }: { token: string }) {
  const [datos, setDatos] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'aviso' | 'error'; texto: string } | null>(null);
  const correoValido = esCorreoInstitucional(datos.correo);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (!datos.nombres.trim() || !datos.apellidos.trim()) { setMensaje({ tipo: 'error', texto: 'Ingrese nombres y apellidos.' }); return; }
    if (!correoValido) { setMensaje({ tipo: 'error', texto: `Solo se puede invitar a correos ${DOMINIO_INSTITUCIONAL}.` }); return; }
    setEnviando(true);
    setMensaje(null);
    try {
      const correo = datos.correo.trim().toLowerCase();
      const resultado = await invitarCoordinador({ nombres: datos.nombres.trim(), apellidos: datos.apellidos.trim(), correo }, token);
      if (resultado.correoEnviado) {
        setMensaje({ tipo: 'ok', texto: `${resultado.mensaje} ${correo} tiene 24 horas para crear su contraseña.` });
        setDatos(VACIO);
      } else {
        setMensaje({ tipo: 'aviso', texto: resultado.mensaje });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo enviar la invitación.' });
    } finally {
      setEnviando(false);
    }
  }

  return <section className="admin-card" aria-labelledby="invitar-coordinador">
    <div className="admin-section-heading"><h2 id="invitar-coordinador"><i className="bi bi-envelope-plus" aria-hidden="true" />Invitar coordinador</h2></div>
    <p className="small text-muted">La persona recibirá un enlace para crear su contraseña. Solo se admiten correos {DOMINIO_INSTITUCIONAL}.</p>
    {mensaje && <div className={`alert ${CLASE_MENSAJE[mensaje.tipo]} py-2 small`} role={mensaje.tipo === 'ok' ? 'status' : 'alert'}>{mensaje.texto}</div>}
    <form className="row g-2 align-items-end" onSubmit={enviar} noValidate>
      <div className="col-md-3"><label htmlFor="inv-nombres" className="form-label small">Nombres</label>
        <input id="inv-nombres" className="form-control" maxLength={100} value={datos.nombres} onChange={e => setDatos({ ...datos, nombres: e.target.value })} /></div>
      <div className="col-md-3"><label htmlFor="inv-apellidos" className="form-label small">Apellidos</label>
        <input id="inv-apellidos" className="form-control" maxLength={100} value={datos.apellidos} onChange={e => setDatos({ ...datos, apellidos: e.target.value })} /></div>
      <div className="col-md-4"><label htmlFor="inv-correo" className="form-label small">Correo institucional</label>
        <input id="inv-correo" type="email" className={`form-control${datos.correo && !correoValido ? ' is-invalid' : ''}`} maxLength={150}
          placeholder={`usuario${DOMINIO_INSTITUCIONAL}`} value={datos.correo} onChange={e => setDatos({ ...datos, correo: e.target.value })} />
        {datos.correo && !correoValido && <div className="invalid-feedback">Debe terminar en {DOMINIO_INSTITUCIONAL}</div>}</div>
      <div className="col-md-2"><button className="btn btn-udea w-100 mt-0" disabled={enviando}>{enviando ? 'Enviando…' : 'Invitar'}</button></div>
    </form>
  </section>;
}
