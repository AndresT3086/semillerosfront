import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { activarCuenta, contrasenaValida, verificarCorreo } from '../api/accesosApi';

export type AccionEnlace = 'verificar' | 'activar';

function Marco({ titulo, icono, children, onVolver }: { titulo: string; icono: string; children: ReactNode; onVolver: () => void }) {
  return <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fcf9 0%, #eef5f1 100%)' }}>
    <div className="udea-header" style={{ borderRadius: '0 0 12px 12px', marginBottom: '2rem' }}>
      <div className="container d-flex justify-content-between align-items-center">
        <h1 className="udea-logo mb-0">UdeA <span>SEMILLEROS</span></h1>
        <button className="btn btn-outline-light btn-sm" onClick={onVolver}>← Volver al portal</button>
      </div>
    </div>
    <main className="container" style={{ maxWidth: 480 }}>
      <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}><div className="card-body p-4">
        <div className="text-center mb-3">
          <i className={`bi bi-${icono} fs-1`} style={{ color: 'var(--udea-verde-principal)' }} aria-hidden="true"></i>
          <h2 className="h4 fw-bold mt-2" style={{ color: 'var(--udea-verde-oscuro)' }}>{titulo}</h2>
        </div>
        {children}
      </div></div>
    </main>
  </div>;
}

// El token es de un solo uso: si el efecto se ejecuta dos veces (StrictMode) se reutiliza la misma petición.
const verificaciones = new Map<string, Promise<string>>();

function verificarUnaVez(token: string): Promise<string> {
  if (!verificaciones.has(token)) verificaciones.set(token, verificarCorreo(token));
  return verificaciones.get(token)!;
}

// Confirmación del correo: se envía una sola vez al abrir el enlace.
function VerificarCorreo({ token, onIrAlLogin, onVolver }: { token: string; onIrAlLogin: (aviso?: string) => void; onVolver: () => void }) {
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);
  useEffect(() => {
    let activo = true;
    verificarUnaVez(token)
      .then(mensaje => { if (activo) setResultado({ ok: true, mensaje }); })
      .catch((err: Error) => { if (activo) setResultado({ ok: false, mensaje: err.message }); });
    return () => { activo = false; };
  }, [token]);

  return <Marco titulo="Confirmación de correo" icono="envelope-check" onVolver={onVolver}>
    {!resultado ? <p className="text-center" role="status"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Confirmando tu correo…</p>
      : <div className={`alert ${resultado.ok ? 'alert-success' : 'alert-warning'}`} role={resultado.ok ? 'status' : 'alert'}>{resultado.mensaje}</div>}
    {resultado && !resultado.ok && <p className="small text-muted">Si el enlace venció, envía la solicitud de nuevo desde «Acceso SIGSI → Solicitar acceso».</p>}
    {resultado && <button className="btn btn-udea w-100 mt-0" onClick={() => onIrAlLogin()}>Ir a Acceso SIGSI</button>}
  </Marco>;
}

// Creación de la contraseña tras la aprobación o la invitación del administrador.
function ActivarCuenta({ token, onIrAlLogin, onVolver }: { token: string; onIrAlLogin: (aviso?: string) => void; onVolver: () => void }) {
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const cumpleReglas = contrasenaValida(contrasena);
  const coincide = contrasena === confirmacion;

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (!cumpleReglas) { setError('La contraseña debe tener entre 10 y 72 caracteres, con al menos una letra y un número.'); return; }
    if (!coincide) { setError('Las contraseñas no coinciden.'); return; }
    setEnviando(true);
    setError(null);
    try {
      const mensaje = await activarCuenta(token, contrasena);
      onIrAlLogin(mensaje || 'Cuenta activada. Ya puedes iniciar sesión.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar la cuenta.');
    } finally {
      setEnviando(false);
    }
  }

  return <Marco titulo="Crea tu contraseña" icono="key" onVolver={onVolver}>
    <p className="small text-muted">Este enlace es de un solo uso. Al crear la contraseña tu cuenta de coordinador quedará activa.</p>
    {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
    <form onSubmit={enviar} noValidate>
      <div className="mb-3"><label htmlFor="act-contrasena" className="form-label small fw-semibold">Nueva contraseña</label>
        <input id="act-contrasena" type="password" autoComplete="new-password" className="form-control" maxLength={72} value={contrasena} onChange={e => setContrasena(e.target.value)} />
        <ul className="small mt-2 mb-0 ps-3">
          <li className={contrasena.length >= 10 && contrasena.length <= 72 ? 'text-success' : 'text-muted'}>Entre 10 y 72 caracteres</li>
          <li className={/\p{L}/u.test(contrasena) && /\d/.test(contrasena) ? 'text-success' : 'text-muted'}>Al menos una letra y un número</li>
        </ul></div>
      <div className="mb-3"><label htmlFor="act-confirmacion" className="form-label small fw-semibold">Confirmar contraseña</label>
        <input id="act-confirmacion" type="password" autoComplete="new-password" className={`form-control${confirmacion && !coincide ? ' is-invalid' : ''}`} maxLength={72} value={confirmacion} onChange={e => setConfirmacion(e.target.value)} />
        {confirmacion && !coincide && <div className="invalid-feedback">Las contraseñas no coinciden</div>}</div>
      <button className="btn btn-udea w-100 mt-0" disabled={enviando}>{enviando ? 'Activando…' : 'Activar mi cuenta'}</button>
    </form>
  </Marco>;
}

export default function EnlaceAccesoPage({ accion, token, onIrAlLogin, onVolver }: {
  accion: AccionEnlace; token: string; onIrAlLogin: (aviso?: string) => void; onVolver: () => void;
}) {
  return accion === 'verificar'
    ? <VerificarCorreo token={token} onIrAlLogin={onIrAlLogin} onVolver={onVolver} />
    : <ActivarCuenta token={token} onIrAlLogin={onIrAlLogin} onVolver={onVolver} />;
}
