import type { SemilleroResumen } from '../types';

interface SemilleroCardProps {
  semillero: SemilleroResumen;
  onInscribirse: (id: number, nombre: string) => void;
  onVerDetalles: (id: number) => void;
}

export default function SemilleroCard({
  semillero,
  onInscribirse,
  onVerDetalles,
}: SemilleroCardProps) {
  return (
    <div className="semillero-card">
      <div className="semillero-header">
        <h3 className="semillero-title">{semillero.nombre}</h3>
        <div>
          {semillero.siglas && (
            <span className="semillero-badge badge-redsin">
              <i className="bi bi-tag me-1"></i>
              {semillero.siglas}
            </span>
          )}
          {semillero.estado && (
            <span className="semillero-badge badge-area">
              <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
              {semillero.estado}
            </span>
          )}
        </div>
      </div>

      <div className="semillero-body">
        <div className="semillero-info">
          <div className="info-item">
            <span className="info-label">
              <i className="bi bi-building info-icon"></i>Facultad:
            </span>
            <span className="info-value">{semillero.facultad}</span>
          </div>
          <div className="info-item">
            <span className="info-label">
              <i className="bi bi-geo-alt info-icon"></i>Campus:
            </span>
            <span className="info-value">{semillero.campus}</span>
          </div>
          <div className="info-item">
            <span className="info-label">
              <i className="bi bi-calendar-check info-icon"></i>Año creación:
            </span>
            <span className="info-value">{semillero.anioCreacion}</span>
          </div>
          <div className="info-item">
            <span className="info-label">
              <i className="bi bi-people info-icon"></i>Grupo investigación:
            </span>
            <span className="info-value">{semillero.grupoInvestigacion}</span>
          </div>
        </div>

        <div className="d-grid semillero-actions">
          <button
            className="btn btn-udea"
            onClick={() => onInscribirse(semillero.id, semillero.nombre)}
          >
            <i className="bi bi-pencil-square me-2"></i>Inscribirse
          </button>
          <button
            className="btn btn-outline-secondary mt-2"
            onClick={() => onVerDetalles(semillero.id)}
          >
            <i className="bi bi-info-circle me-2"></i>Ver detalles
          </button>
        </div>
      </div>
    </div>
  );
}
