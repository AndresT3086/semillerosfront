import { useEffect, useState } from 'react';
import type { InscripcionPendiente, SemilleroCoordinador } from '../types';
import {
  aprobarInscripcion,
  getInscripcionesPendientes,
  getMisSemilleros,
  iniciarCaracterizacion,
  rechazarInscripcion,
} from '../api/semillerosApi';

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

function estadoCaracterizacionLabel(estado?: string | null) {
  if (estado === 'COMPLETO') return 'Caracterizado';
  if (!estado || estado === 'GENERAL_PENDIENTE') return 'Pendiente';
  return 'En caracterización';
}

function estadoVisibleSemillero(semillero: SemilleroCoordinador) {
  if (semillero.estadoCaracterizacion !== 'COMPLETO') {
    return {
      className: 'badge-progress',
      label: estadoCaracterizacionLabel(semillero.estadoCaracterizacion),
    };
  }

  return {
    className: 'badge-area',
    label: semillero.estado === 'ACTIVO' ? 'Activo' : estadoLabel(semillero.estado),
  };
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

function nombreCompleto(inscripcion: InscripcionPendiente) {
  return `${inscripcion.nombres} ${inscripcion.apellidos}`.trim();
}

export default function CoordinadorHomePage({
  token,
  correoCoordinador,
  onLogout,
  onOpenSemillero,
}: Props) {
  const [activeTab, setActiveTab] = useState<'semilleros' | 'solicitudes'>('semilleros');
  const [semilleros, setSemilleros] = useState<SemilleroCoordinador[]>([]);
  const [solicitudes, setSolicitudes] = useState<InscripcionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  async function cargarSolicitudes(baseSemilleros = semilleros) {
    if (baseSemilleros.length === 0) {
      setSolicitudes([]);
      return;
    }

    setLoadingSolicitudes(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        baseSemilleros.map((semillero) => getInscripcionesPendientes(semillero.id, token)),
      );
      const solicitudesCargadas = results
        .filter((result): result is PromiseFulfilledResult<InscripcionPendiente[]> => result.status === 'fulfilled')
        .flatMap((result) => result.value);

      setSolicitudes(solicitudesCargadas);

      if (results.some((result) => result.status === 'rejected')) {
        setError('No se pudieron cargar algunas solicitudes. Verifica que el backend esté actualizado.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoadingSolicitudes(false);
    }
  }

  useEffect(() => {
    cargarSemilleros();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'solicitudes' && !loading) {
      cargarSolicitudes();
    }
  }, [activeTab, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRegistrar() {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const nuevo = await iniciarCaracterizacion(token);
      onOpenSemillero(nuevo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el semillero.');
    } finally {
      setCreating(false);
    }
  }

  async function handleCambiarEstado(idInscripcion: number, accion: 'aprobar' | 'rechazar') {
    setProcessingId(idInscripcion);
    setError(null);
    setSuccess(null);
    try {
      if (accion === 'aprobar') {
        await aprobarInscripcion(idInscripcion, token);
        setSuccess('Solicitud aprobada exitosamente.');
      } else {
        await rechazarInscripcion(idInscripcion, token);
        setSuccess('Solicitud rechazada exitosamente.');
      }
      setSolicitudes((prev) => prev.filter((solicitud) => solicitud.id !== idInscripcion));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la solicitud.');
    } finally {
      setProcessingId(null);
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

          <div className="d-flex flex-wrap gap-2 mb-4">
            <button
              className={`btn ${activeTab === 'semilleros' ? 'btn-udea' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('semilleros')}
            >
              <i className="bi bi-journal-text me-2"></i>Mis semilleros
            </button>
            <button
              className={`btn ${activeTab === 'solicitudes' ? 'btn-udea' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('solicitudes')}
            >
              <i className="bi bi-inbox me-2"></i>Solicitudes pendientes
              {solicitudes.length > 0 && (
                <span className="badge text-bg-light ms-2">{solicitudes.length}</span>
              )}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          {success && (
            <div className="alert alert-success py-2 small">
              <i className="bi bi-check-circle me-2"></i>{success}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--udea-verde-principal)' }}></div>
              <p className="text-muted mt-3 mb-0">Cargando tus semilleros...</p>
            </div>
          ) : activeTab === 'semilleros' && semilleros.length === 0 ? (
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
          ) : activeTab === 'semilleros' ? (
            <div className="row g-4">
              {semilleros.map((semillero) => {
                const estadoVisible = estadoVisibleSemillero(semillero);
                return (
                  <div className="col-12 col-md-6" key={semillero.id}>
                    <div className="role-option text-start">
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div>
                          <span className="semillero-badge badge-redsin mb-2">{semillero.codigo}</span>
                          <h3 className="h5 fw-bold mb-1" style={{ color: 'var(--udea-verde-oscuro)' }}>
                            {semillero.nombre || 'Semillero sin nombre'}
                          </h3>
                        </div>
                        <span className={`semillero-badge ${estadoVisible.className}`}>{estadoVisible.label}</span>
                      </div>

                      <div className="info-item">
                        <span className="info-label">Caracterización:</span>
                        <span className="info-value">{estadoCaracterizacionLabel(semillero.estadoCaracterizacion)}</span>
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
                );
              })}
            </div>
          ) : loadingSolicitudes ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--udea-verde-principal)' }}></div>
              <p className="text-muted mt-3 mb-0">Cargando solicitudes pendientes...</p>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-5">
              <div className="role-icon coordinador-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h3 className="h4 mt-3" style={{ color: 'var(--udea-verde-oscuro)' }}>
                No tienes solicitudes pendientes
              </h3>
              <p className="text-muted">
                Cuando un estudiante solicite inscripción a alguno de tus semilleros aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {solicitudes.map((solicitud) => (
                <div className="role-option text-start" key={solicitud.id}>
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <span className="semillero-badge badge-redsin">{solicitud.nombreSemillero}</span>
                        <span className="semillero-badge badge-area">{solicitud.estado}</span>
                      </div>
                      <h3 className="h5 fw-bold mb-2" style={{ color: 'var(--udea-verde-oscuro)' }}>
                        {nombreCompleto(solicitud)}
                      </h3>
                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <span className="info-label">Correo:</span>
                          <span className="info-value ms-2">{solicitud.correo}</span>
                        </div>
                        <div className="col-md-6">
                          <span className="info-label">Teléfono:</span>
                          <span className="info-value ms-2">{solicitud.telefono}</span>
                        </div>
                        <div className="col-md-6">
                          <span className="info-label">Programa:</span>
                          <span className="info-value ms-2">{solicitud.programa}</span>
                        </div>
                        <div className="col-md-6">
                          <span className="info-label">Semestre:</span>
                          <span className="info-value ms-2">{solicitud.semestre}</span>
                        </div>
                        <div className="col-md-6">
                          <span className="info-label">Cédula:</span>
                          <span className="info-value ms-2">{solicitud.cedula}</span>
                        </div>
                        <div className="col-md-6">
                          <span className="info-label">Fecha:</span>
                          <span className="info-value ms-2">{fechaVisible(solicitud.fechaInscripcion)}</span>
                        </div>
                      </div>
                      <p className="text-muted mb-0">{solicitud.motivacion}</p>
                    </div>

                    <div className="d-flex flex-row flex-lg-column gap-2 justify-content-end" style={{ minWidth: 170 }}>
                      <button
                        className="btn btn-udea"
                        disabled={processingId === solicitud.id}
                        onClick={() => handleCambiarEstado(solicitud.id, 'aprobar')}
                      >
                        {processingId === solicitud.id ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <><i className="bi bi-check-circle me-1"></i>Aprobar</>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        disabled={processingId === solicitud.id}
                        onClick={() => handleCambiarEstado(solicitud.id, 'rechazar')}
                      >
                        <i className="bi bi-x-circle me-1"></i>Rechazar
                      </button>
                    </div>
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
