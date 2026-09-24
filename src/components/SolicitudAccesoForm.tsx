import { useEffect, useState, type FormEvent } from 'react';
import { getCaptcha, getUnidades } from '../api/semillerosApi';
import { DOMINIO_INSTITUCIONAL, esCorreoInstitucional, solicitarAcceso } from '../api/accesosApi';
import type { CaptchaResponse, FiltroItem } from '../types';

const VACIO = { nombres: '', apellidos: '', cedula: '', correo: '', idUnidadAcademica: '', justificacion: '', sitioWeb: '' };
type Campos = typeof VACIO;

function validar(c: Campos): Partial<Record<keyof Campos, string>> {
  const errores: Partial<Record<keyof Campos, string>> = {};
  if (!c.nombres.trim()) errores.nombres = 'Ingrese sus nombres';
  if (!c.apellidos.trim()) errores.apellidos = 'Ingrese sus apellidos';
  if (!/^\d{7,10}$/.test(c.cedula)) errores.cedula = 'La cédula debe tener entre 7 y 10 dígitos';
  if (!esCorreoInstitucional(c.correo)) errores.correo = `Use su correo institucional (${DOMINIO_INSTITUCIONAL})`;
  const justificacion = c.justificacion.trim().length;
  if (justificacion < 20 || justificacion > 1000) errores.justificacion = 'Describa en 20 a 1000 caracteres el semillero que coordina o coordinará';
  return errores;
}

// Solicitud de acceso como coordinador. La solicitud llega al administrador solo
// después de que la persona confirme su correo institucional.
export default function SolicitudAccesoForm({ onVolver }: { onVolver: () => void }) {
  const [campos, setCampos] = useState(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof Campos, string>>>({});
  const [unidades, setUnidades] = useState<FiltroItem[]>([]);
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState<string | null>(null);

  function cargarCaptcha() {
    getCaptcha().then(setCaptcha).catch(() => setError('No se pudo cargar la verificación anti-bot.'));
  }

  useEffect(() => {
    let activo = true;
    getUnidades().then(items => { if (activo) setUnidades(items); }).catch(() => { if (activo) setUnidades([]); });
    getCaptcha().then(c => { if (activo) setCaptcha(c); }).catch(() => { if (activo) setError('No se pudo cargar la verificación anti-bot.'); });
    return () => { activo = false; };
  }, []);

  function cambiar(campo: keyof Campos, valor: string) {
    setCampos(actual => ({ ...actual, [campo]: valor }));
    setErrores(actual => ({ ...actual, [campo]: undefined }));
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    const encontrados = validar(campos);
    setErrores(encontrados);
    const rMath = Number.parseInt(respuesta, 10);
    if (Object.keys(encontrados).length || !captcha) return;
    if (Number.isNaN(rMath)) { setError('Resuelva la verificación anti-bot.'); return; }
    setEnviando(true);
    setError(null);
    try {
      const mensaje = await solicitarAcceso({
        nombres: campos.nombres.trim(), apellidos: campos.apellidos.trim(), cedula: campos.cedula,
        correo: campos.correo.trim().toLowerCase(),
        idUnidadAcademica: campos.idUnidadAcademica ? Number(campos.idUnidadAcademica) : null,
        justificacion: campos.justificacion.trim(), sitioWeb: campos.sitioWeb,
        respuestaMath: rMath, operando1: captcha.operando1, operando2: captcha.operando2,
      });
      setEnviada(mensaje);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
      setRespuesta('');
      cargarCaptcha();
    } finally {
      setEnviando(false);
    }
  }

  if (enviada) {
    return <div className="text-center" role="status">
      <i className="bi bi-envelope-check fs-1" style={{ color: 'var(--udea-verde-principal)' }} aria-hidden="true"></i>
      <h5 className="fw-bold mt-2" style={{ color: 'var(--udea-verde-oscuro)' }}>Revisa tu correo</h5>
      <p className="small text-muted">{enviada}</p>
      <p className="small text-muted">El enlace vence en una hora. Después de confirmarlo, un administrador revisará tu solicitud.</p>
      <button type="button" className="btn btn-link" onClick={onVolver}>Volver a iniciar sesión</button>
    </div>;
  }

  const clase = (campo: keyof Campos) => `form-control${errores[campo] ? ' is-invalid' : ''}`;
  const ayuda = (campo: keyof Campos) => errores[campo] && <div className="invalid-feedback d-block">{errores[campo]}</div>;

  return <form onSubmit={enviar} noValidate aria-label="Solicitud de acceso como coordinador">
    <p className="small text-muted">Diligencia el formulario con tu correo <strong>{DOMINIO_INSTITUCIONAL}</strong>. Te enviaremos un enlace para confirmarlo y luego un administrador aprobará tu acceso.</p>
    {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
    <div className="row g-2">
      <div className="col-sm-6 mb-2"><label htmlFor="sol-nombres" className="form-label small fw-semibold">Nombres *</label>
        <input id="sol-nombres" className={clase('nombres')} maxLength={100} value={campos.nombres} onChange={e => cambiar('nombres', e.target.value)} />{ayuda('nombres')}</div>
      <div className="col-sm-6 mb-2"><label htmlFor="sol-apellidos" className="form-label small fw-semibold">Apellidos *</label>
        <input id="sol-apellidos" className={clase('apellidos')} maxLength={100} value={campos.apellidos} onChange={e => cambiar('apellidos', e.target.value)} />{ayuda('apellidos')}</div>
      <div className="col-sm-6 mb-2"><label htmlFor="sol-cedula" className="form-label small fw-semibold">Cédula *</label>
        <input id="sol-cedula" className={clase('cedula')} inputMode="numeric" maxLength={10} value={campos.cedula} onChange={e => cambiar('cedula', e.target.value.replace(/\D/g, ''))} />{ayuda('cedula')}</div>
      <div className="col-sm-6 mb-2"><label htmlFor="sol-correo" className="form-label small fw-semibold">Correo institucional *</label>
        <input id="sol-correo" type="email" className={clase('correo')} placeholder={`usuario${DOMINIO_INSTITUCIONAL}`} maxLength={150} value={campos.correo} onChange={e => cambiar('correo', e.target.value)} />{ayuda('correo')}</div>
      <div className="col-12 mb-2"><label htmlFor="sol-unidad" className="form-label small fw-semibold">Unidad académica</label>
        <select id="sol-unidad" className="form-select" value={campos.idUnidadAcademica} onChange={e => cambiar('idUnidadAcademica', e.target.value)}>
          <option value="">Seleccione (opcional)</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select></div>
      <div className="col-12 mb-2"><label htmlFor="sol-justificacion" className="form-label small fw-semibold">¿Qué semillero coordinas o coordinarás? *</label>
        <textarea id="sol-justificacion" className={clase('justificacion')} rows={3} maxLength={1000} value={campos.justificacion}
          onChange={e => cambiar('justificacion', e.target.value)} placeholder="Nombre del semillero, grupo de investigación y tu vínculo con la universidad" />
        <small className="text-muted">{campos.justificacion.trim().length}/1000</small>{ayuda('justificacion')}</div>
    </div>
    {/* Campo trampa: invisible para las personas, los bots suelen llenarlo */}
    <div className="solicitud-trampa" aria-hidden="true">
      <label htmlFor="sol-sitio">Sitio web</label>
      <input id="sol-sitio" tabIndex={-1} autoComplete="off" value={campos.sitioWeb} onChange={e => cambiar('sitioWeb', e.target.value)} />
    </div>
    <div className="my-3 p-3 rounded" style={{ background: 'var(--udea-gris-claro)', border: '1px solid var(--udea-gris)' }}>
      <label htmlFor="sol-captcha" className="small fw-semibold mb-2 d-block" style={{ color: 'var(--udea-verde-oscuro)' }}><i className="bi bi-robot me-2" aria-hidden="true"></i>Verificación anti-bot</label>
      {captcha && <div className="d-flex align-items-center gap-3">
        <div className="px-3 py-2 rounded fw-bold" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{captcha.operando1} + {captcha.operando2} = ?</div>
        <input id="sol-captcha" type="number" className="form-control" style={{ maxWidth: 100 }} value={respuesta} onChange={e => setRespuesta(e.target.value)} />
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cargarCaptcha} aria-label="Nuevo captcha"><i className="bi bi-arrow-clockwise" aria-hidden="true"></i></button>
      </div>}
    </div>
    <button type="submit" className="btn w-100 fw-semibold" disabled={enviando || !captcha}
      style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white', borderRadius: 8 }}>
      {enviando ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Enviando…</> : <><i className="bi bi-send me-2" aria-hidden="true"></i>Enviar solicitud</>}
    </button>
    <button type="button" className="btn btn-link w-100 mt-2 small" onClick={onVolver}>Ya tengo cuenta, iniciar sesión</button>
  </form>;
}
