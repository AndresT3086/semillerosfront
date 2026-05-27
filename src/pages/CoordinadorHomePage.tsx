import { useEffect, useState } from 'react';
import type { SemilleroCoordinador } from '../types';
import { getMisSemilleros, iniciarCaracterizacion } from '../api/semillerosApi';

interface Props {
  token: string;
  correoCoordinador: string;
  onLogout: () => void;
  onOpenSemillero: (idSemillero: number) => void;
}

function estadoLabel(estado?: string | null) {
  if (!estado) return 'Sin estado';
  return estado.replaceAll('_', ' ');
}

function accionPrincipal(semillero: SemilleroCoordinador) {
  if (semillero.estado === 'BORRADOR' || semillero.estadoCaracterizacion !== 'COMPLETO') {
    return 'Continuar caracterización';
  }
  return 'Administrar';
}

function fechaVisible(fecha?: string | null) {
  if (!fecha) return 'Sin actualización';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(fecha));
}

export default function CoordinadorHomePage({
  token,
  correoCoordinador,
  onLogout,
  onOpenSemillero,
}: Props) {
  const [semilleros, setSemilleros] = useState<SemilleroCoordinador[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarSemilleros() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMisSemilleros(token);
      setSemilleros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus semilleros.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarSemilleros();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRegistrar() {
    setCreating(true);
    setError(null);
    try {
      const nuevo = await iniciarCaracterizacion(token);
      onOpenSemillero(nuevo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el semillero.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fcf9 0%, #eef5f1 100%)' }}>
      <div className="udea-header" style={{ borderRadius: '0 0 12px 12px', marginBottom: 0, paddingBottom: '1rem' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="udea-logo mb-1" style={{ fontSize: '1.5rem' }}>UdeA <span>SIGSI</span></h1>
              <span className="sigsi-badge">GESTIÓN DE SEMILLEROS</span>
            </div>
            <div className="col-auto text-end">
              <div className="small text-white opacity-75 mb-1">
                <i className="bi bi-person-circle me-1"></i>{correoCoordinador}
              </div>
              <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                <i className="bi bi-box-arrow-left me-1"></i>Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-4" style={{ maxWidth: 1100 }}>
        <div className="filter-card">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h2 className="filter-title mb-2">Mis semilleros</h2>
              <p className="text-muted mb-0">
                Revisa tus semilleros registrados o inicia una nueva caracterización.
              </p>
            </div>
            <button className="btn-crear-semillero" onClick={handleRegistrar} disabled={creating}>
              {creating ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Registrando...</>
              ) : (
                <><i className="bi bi-plus-circle-fill"></i>Registrar nuevo semillero</>
              )}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--udea-verde-principal)' }}></div>
              <p className="text-muted mt-3 mb-0">Cargando tus semilleros...</p>
            </div>
          ) : semilleros.length === 0 ? (
            <div className="text-center py-5">
              <div className="role-icon coordinador-icon">
                <i className="bi bi-journal-plus"></i>
              </div>
              <h3 className="h4 mt-3" style={{ color: 'var(--udea-verde-oscuro)' }}>
                Aún no tienes semilleros registrados
              </h3>
              <p className="text-muted">
                Puedes registrar un nuevo semillero para iniciar el proceso de caracterización.
              </p>
              <button className="btn btn-udea px-4" onClick={handleRegistrar} disabled={creating}>
                <i className="bi bi-plus-circle-fill me-2"></i>Registrar nuevo semillero
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {semilleros.map((semillero) => (
                <div className="col-12 col-md-6" key={semillero.id}>
                  <div className="role-option text-start">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <span className="semillero-badge badge-redsin mb-2">{semillero.codigo}</span>
                        <h3 className="h5 fw-bold mb-1" style={{ color: 'var(--udea-verde-oscuro)' }}>
                          {semillero.nombre || 'Semillero sin nombre'}
                        </h3>
                      </div>
                      <span className="semillero-badge badge-area">{estadoLabel(semillero.estado)}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Caracterización:</span>
                      <span className="info-value">{estadoLabel(semillero.estadoCaracterizacion)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Última actualización:</span>
                      <span className="info-value">
                        {fechaVisible(semillero.fechaActualizacion ?? semillero.fechaCreacion)}
                      </span>
                    </div>

                    <button className="btn-select" onClick={() => onOpenSemillero(semillero.id)}>
                      <i className="bi bi-arrow-right-circle me-1"></i>{accionPrincipal(semillero)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
