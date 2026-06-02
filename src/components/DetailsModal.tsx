import { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle';
import type { SemilleroDetalle } from '../types';
import { getSemilleroById } from '../api/semillerosApi';

interface DetailsModalProps {
  semilleroId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onInscribirse: (id: number, nombre: string) => void;
}

function mockOdsPorArea(areaOcde?: string) {
  const area = areaOcde?.toLowerCase() ?? '';
  if (area.includes('salud')) return 'ODS 3 - Salud y bienestar';
  if (area.includes('agr')) return 'ODS 2 - Hambre cero';
  if (area.includes('educ')) return 'ODS 4 - Educación de calidad';
  if (area.includes('social') || area.includes('derecho')) return 'ODS 16 - Paz, justicia e instituciones sólidas';
  return 'ODS 9 - Industria, innovación e infraestructura';
}

function detalleExtra(detalle: SemilleroDetalle) {
  const ods = Array.isArray(detalle.ods)
    ? detalle.ods.join(', ')
    : detalle.ods ?? mockOdsPorArea(detalle.areaOcde);

  return {
    departamento: detalle.departamento ?? 'Antioquia',
    ods,
    correoCoordinador: detalle.correoCoordinador ?? detalle.correoSemillero,
  };
}

export default function DetailsModal({
  semilleroId,
  isOpen,
  onClose,
  onInscribirse,
}: DetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Modal | null>(null);
  const [detalle, setDetalle] = useState<SemilleroDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const extra = detalle ? detalleExtra(detalle) : null;

  useEffect(() => {
    if (!modalRef.current) return;
    instanceRef.current = new Modal(modalRef.current, { backdrop: true });
    modalRef.current.addEventListener('hidden.bs.modal', onClose);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!instanceRef.current) return;
    if (isOpen) {
      instanceRef.current.show();
    } else {
      instanceRef.current.hide();
    }
  }, [isOpen]);

  // Cargar detalle cuando se abre el modal
  useEffect(() => {
    if (!isOpen || semilleroId == null) return;
    setLoading(true);
    setError(null);
    setDetalle(null);
    getSemilleroById(semilleroId)
      .then(setDetalle)
      .catch(() => setError('No se pudo cargar el detalle del semillero.'))
      .finally(() => setLoading(false));
  }, [isOpen, semilleroId]);

  return (
    <div className="modal fade" ref={modalRef} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content modal-udea">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-info-circle me-2"></i>
              {detalle?.nombre ?? 'Detalle del Semillero'}
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div className="modal-body">
            {loading && (
              <div className="text-center py-5">
                <div
                  className="spinner-border"
                  style={{ color: 'var(--udea-verde-principal)' }}
                  role="status"
                >
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3">Cargando información...</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {detalle && (
              <>
                <div className="row">
                  <div className="col-md-6">
                    <div className="info-item">
                      <span className="info-label">Código:</span>
                      <span className="info-value">{detalle.codigo}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Facultad:</span>
                      <span className="info-value">{detalle.facultad}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Campus:</span>
                      <span className="info-value">{detalle.campus}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Departamento:</span>
                      <span className="info-value">{extra?.departamento}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Año creación:</span>
                      <span className="info-value">{detalle.anioCreacion}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Área OCDE:</span>
                      <span className="info-value">{detalle.areaOcde}</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="info-item">
                      <span className="info-label">Grupo investigación:</span>
                      <span className="info-value">{detalle.grupoInvestigacion}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Correo semillero:</span>
                      <span className="info-value">{detalle.correoSemillero}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Correo coordinador:</span>
                      <span className="info-value">{extra?.correoCoordinador}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ODS:</span>
                      <span className="info-value">{extra?.ods}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">{detalle.telefono}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Semilleristas:</span>
                      <span className="info-value">{detalle.totalSemilleristas}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estado:</span>
                      <span className="info-value">{detalle.estado}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {detalle.mision && (
                    <>
                      <h6>Misión</h6>
                      <p className="text-muted">{detalle.mision}</p>
                    </>
                  )}
                  {detalle.vision && (
                    <>
                      <h6 className="mt-3">Visión</h6>
                      <p className="text-muted">{detalle.vision}</p>
                    </>
                  )}
                  {detalle.objetivo && (
                    <>
                      <h6 className="mt-3">Objetivo principal</h6>
                      <p className="text-muted">{detalle.objetivo}</p>
                    </>
                  )}
                  {detalle.lineasInvestigacion && (
                    <>
                      <h6 className="mt-3">Líneas de investigación</h6>
                      <p className="text-muted">{detalle.lineasInvestigacion}</p>
                    </>
                  )}
                  {detalle.palabrasClave && (
                    <>
                      <h6 className="mt-3">Palabras clave</h6>
                      <p className="text-muted">{detalle.palabrasClave}</p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Cerrar
            </button>
            {detalle && (
              <button
                type="button"
                className="btn btn-udea"
                onClick={() => {
                  onClose();
                  onInscribirse(detalle.id, detalle.nombre);
                }}
              >
                <i className="bi bi-pencil-square me-2"></i>Inscribirse
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
