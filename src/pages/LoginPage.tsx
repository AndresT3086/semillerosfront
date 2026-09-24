import { useEffect, useState } from 'react';
import type { CaptchaResponse, LoginResponse } from '../types';
import { getCaptcha, loginCoordinador } from '../api/semillerosApi';
import SolicitudAccesoForm from '../components/SolicitudAccesoForm';

interface LoginPageProps {
  onLoginSuccess: (response: LoginResponse) => void;
  onBack: () => void;
  /** Mensaje informativo sobre el formulario (por ejemplo, cuenta recién activada). */
  aviso?: string | null;
}

export default function LoginPage({ onLoginSuccess, onBack, aviso }: LoginPageProps) {
  const [modo, setModo] = useState<'ingresar' | 'solicitar'>('ingresar');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargarCaptcha() {
    setLoadingCaptcha(true);
    try {
      const c = await getCaptcha();
      setCaptcha(c);
    } catch {
      setError('No se pudo cargar el captcha. Verifique que el servidor esté activo.');
    } finally {
      setLoadingCaptcha(false);
    }
  }

  useEffect(() => {
    cargarCaptcha();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captcha) return;
    const rMath = parseInt(respuesta);
    if (isNaN(rMath)) {
      setError('Ingrese la respuesta del captcha.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loginCoordinador(
        correo,
        password,
        rMath,
        captcha.operando1,
        captcha.operando2,
      );
      onLoginSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      setRespuesta('');
      cargarCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fcf9 0%, #eef5f1 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="udea-header" style={{ borderRadius: '0 0 12px 12px', marginBottom: '2rem' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="udea-logo mb-1">UdeA <span>SEMILLEROS</span></h1>
              <div className="system-title" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>
                SISTEMA DE GESTIÓN DE SEMILLEROS - SIGSI
              </div>
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-light btn-sm" onClick={onBack}>
                ← Volver al portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login card */}
      <div className="container" style={{ maxWidth: modo === 'solicitar' ? 620 : 460, flex: 1 }}>
        <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <i className="bi bi-shield-lock-fill text-white fs-4"></i>
              </div>
              <h4 className="fw-bold mb-0" style={{ color: 'var(--udea-verde-oscuro)' }}>
                {modo === 'ingresar' ? 'Acceso SIGSI' : 'Solicitar acceso como coordinador'}
              </h4>
              <p className="text-muted small mt-1 mb-0">{modo === 'ingresar' ? 'Ingrese con su cuenta institucional' : 'Registro de coordinadores de semillero'}</p>
            </div>

            {modo === 'solicitar' ? <SolicitudAccesoForm onVolver={() => setModo('ingresar')} /> : <>
            {aviso && (
              <div className="alert alert-success py-2 small mb-3" role="status">
                <i className="bi bi-check-circle me-2"></i>{aviso}
              </div>
            )}

            {error && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>{error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label fw-semibold small" style={{ color: 'var(--udea-verde-oscuro)' }}>
                  Correo institucional
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{ borderColor: 'var(--udea-gris)' }}>
                    <i className="bi bi-envelope" style={{ color: 'var(--udea-verde-principal)' }}></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="coordinador@udea.edu.co"
                    value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    required
                    style={{ borderColor: 'var(--udea-gris)' }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small" style={{ color: 'var(--udea-verde-oscuro)' }}>
                  Contraseña
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{ borderColor: 'var(--udea-gris)' }}>
                    <i className="bi bi-lock" style={{ color: 'var(--udea-verde-principal)' }}></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ borderColor: 'var(--udea-gris)' }}
                  />
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="mb-4 p-3 rounded" style={{ background: 'var(--udea-gris-claro)', border: '1px solid var(--udea-gris)' }}>
                <p className="small fw-semibold mb-2" style={{ color: 'var(--udea-verde-oscuro)' }}>
                  <i className="bi bi-robot me-2"></i>Verificación anti-bot
                </p>
                {loadingCaptcha ? (
                  <div className="text-center py-1">
                    <span className="spinner-border spinner-border-sm" style={{ color: 'var(--udea-verde-principal)' }}></span>
                  </div>
                ) : captcha ? (
                  <div className="d-flex align-items-center gap-3">
                    <div className="px-3 py-2 rounded fw-bold" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white', fontSize: '1.1rem', letterSpacing: 2, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {captcha.operando1} + {captcha.operando2} = ?
                    </div>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Respuesta"
                      value={respuesta}
                      onChange={e => setRespuesta(e.target.value)}
                      style={{ maxWidth: 100, borderColor: 'var(--udea-gris)' }}
                      required
                    />
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cargarCaptcha} title="Nuevo captcha">
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                className="btn w-100 fw-semibold"
                style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white', borderRadius: 8 }}
                disabled={loading || loadingCaptcha}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Ingresando...</>
                ) : (
                  <><i className="bi bi-box-arrow-in-right me-2"></i>Ingresar</>
                )}
              </button>
            </form>

            <p className="text-center text-muted small mt-3 mb-0">
              ¿Coordinas un semillero y aún no tienes cuenta?{' '}
              <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setModo('solicitar')}>
                Solicitar acceso
              </button>
            </p>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
