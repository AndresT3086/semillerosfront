import type { RelacionamientoFormData } from '../../types';

interface Props {
  value: RelacionamientoFormData;
  onChange: (value: RelacionamientoFormData) => void;
  onSave: () => void;
  onPrev: () => void;
  saving: boolean;
}

export default function TabRelacionamiento({ value, onChange, onSave, onPrev, saving }: Props) {
  const set = (field: keyof RelacionamientoFormData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div>
      <div className="p-2 rounded mb-3 fw-semibold text-white small" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))' }}>
        🤝 Relacionamiento
      </div>

      {/* Grupo de investigación */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>¿Adscrito a grupo de investigación?</label>
          <div className="p-2 rounded d-flex gap-3" style={{ background: 'var(--udea-gris-claro)' }}>
            {['si', 'no'].map(v => (
              <label key={v} className="d-flex align-items-center gap-1 small" style={{ cursor: 'pointer' }}>
                <input type="radio" name="adscrito" value={v} checked={value.adscrito === v}
                  onChange={() => set('adscrito', v)} style={{ accentColor: 'var(--udea-verde-principal)' }} />
                {v === 'si' ? 'Sí' : 'No'}
              </label>
            ))}
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Grupo de investigación</label>
          <input type="text" className="form-control form-control-sm" placeholder="Nombre o código del grupo"
            value={value.grupo} onChange={e => set('grupo', e.target.value)} disabled={value.adscrito !== 'si'} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Relación con el grupo</label>
          <input type="text" className="form-control form-control-sm" placeholder="Ej. Reuniones mensuales"
            value={value.relacionGrupo} onChange={e => set('relacionGrupo', e.target.value)} disabled={value.adscrito !== 'si'} />
        </div>
      </div>

      {/* Centro de investigaciones */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Centro de investigaciones</label>
          <input type="text" className="form-control form-control-sm" placeholder="Nombre del centro"
            value={value.centro} onChange={e => set('centro', e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Relación con el centro</label>
          <input type="text" className="form-control form-control-sm" placeholder="NE"
            value={value.relacionCentro} onChange={e => set('relacionCentro', e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Departamento</label>
          <input type="text" className="form-control form-control-sm" placeholder="Ej. Antropología"
            value={value.departamento} onChange={e => set('departamento', e.target.value)} />
        </div>
      </div>

      {/* Facultad */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Relación con el departamento</label>
          <input type="text" className="form-control form-control-sm" placeholder="NE"
            value={value.relacionDept} onChange={e => set('relacionDept', e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Facultad</label>
          <input type="text" className="form-control form-control-sm" placeholder="Ej. Ingeniería"
            value={value.facultad} onChange={e => set('facultad', e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Relación con la facultad</label>
          <input type="text" className="form-control form-control-sm" placeholder="NE"
            value={value.relacionFacultad} onChange={e => set('relacionFacultad', e.target.value)} />
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
