import type { DofaFormData } from '../../types';

interface Props {
  value: DofaFormData;
  onChange: (value: DofaFormData) => void;
  onSave: () => void;
  onPrev: () => void;
  saving: boolean;
}

export default function TabDofa({ value, onChange, onSave, onPrev, saving }: Props) {
  const set = (field: keyof DofaFormData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div>
      <div className="p-2 rounded mb-3 fw-semibold text-white small" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))' }}>
        📊 Análisis DOFA
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Fortalezas <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <textarea className="form-control form-control-sm" rows={4}
            placeholder="Ej. Compromiso del equipo, interdisciplinariedad, liderazgo activo..."
            value={value.fortalezas} onChange={e => set('fortalezas', e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Debilidades <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <textarea className="form-control form-control-sm" rows={4}
            placeholder="Ej. Falta de financiación, alta rotación de miembros..."
            value={value.debilidades} onChange={e => set('debilidades', e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Oportunidades <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <textarea className="form-control form-control-sm" rows={4}
            placeholder="Ej. Convocatorias internas, alianzas con grupos de investigación..."
            value={value.oportunidades} onChange={e => set('oportunidades', e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Amenazas <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <textarea className="form-control form-control-sm" rows={4}
            placeholder="Ej. Recortes presupuestales, competencia de otros semilleros..."
            value={value.amenazas} onChange={e => set('amenazas', e.target.value)} />
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 pt-3" style={{ borderTop: '1px solid var(--udea-gris)' }}>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onPrev}>← Anterior</button>
        <button type="button" className="btn btn-sm fw-semibold px-4"
          style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white' }}
          onClick={onSave} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
          Guardar y Continuar →
        </button>
      </div>
    </div>
  );
}
