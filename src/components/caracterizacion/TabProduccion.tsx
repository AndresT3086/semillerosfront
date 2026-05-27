import type { ProduccionFormData } from '../../types';

interface Props {
  value: ProduccionFormData;
  onChange: (value: ProduccionFormData) => void;
  onSave: () => void;
  onPrev: () => void;
  saving: boolean;
}

export default function TabProduccion({ value, onChange, onSave, onPrev, saving }: Props) {
  const set = (field: keyof ProduccionFormData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const radioGroup = (
    name: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div className="d-flex gap-3">
      {['si', 'no'].map(v => (
        <label key={v} className="d-flex align-items-center gap-1 small" style={{ cursor: 'pointer' }}>
          <input type="radio" name={name} value={v} checked={value === v}
            onChange={() => onChange(v)} style={{ accentColor: 'var(--udea-verde-principal)' }} />
          {v === 'si' ? 'Sí' : 'No'}
        </label>
      ))}
    </div>
  );

  return (
    <div>
      <div className="p-2 rounded mb-3 fw-semibold text-white small" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))' }}>
        📚 Producción Académica
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>¿Tienen artículos científicos?</label>
          <div className="p-2 rounded" style={{ background: 'var(--udea-gris-claro)' }}>
            {radioGroup('articulos', value.tieneArticulos, v => set('tieneArticulos', v))}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Cantidad de artículos</label>
          <input type="number" className="form-control form-control-sm" min={0} placeholder="0"
            value={value.cantArticulos} onChange={e => set('cantArticulos', e.target.value)} disabled={value.tieneArticulos !== 'si'} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>¿Tienen libros o capítulos?</label>
          <div className="p-2 rounded" style={{ background: 'var(--udea-gris-claro)' }}>
            {radioGroup('libros', value.tieneLibros, v => set('tieneLibros', v))}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Cantidad de libros/capítulos</label>
          <input type="number" className="form-control form-control-sm" min={0} placeholder="0"
            value={value.cantLibros} onChange={e => set('cantLibros', e.target.value)} disabled={value.tieneLibros !== 'si'} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>¿Organizan eventos?</label>
          <div className="p-2 rounded" style={{ background: 'var(--udea-gris-claro)' }}>
            {radioGroup('orgEventos', value.organizaEventos, v => set('organizaEventos', v))}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Cantidad de eventos organizados</label>
          <input type="number" className="form-control form-control-sm" min={0} placeholder="0"
            value={value.cantEventos} onChange={e => set('cantEventos', e.target.value)} disabled={value.organizaEventos !== 'si'} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>¿Participan en eventos?</label>
          <div className="p-2 rounded" style={{ background: 'var(--udea-gris-claro)' }}>
            {radioGroup('partEventos', value.participaEventos, v => set('participaEventos', v))}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Cantidad de participaciones</label>
          <input type="number" className="form-control form-control-sm" min={0} placeholder="0"
            value={value.cantParticipaciones} onChange={e => set('cantParticipaciones', e.target.value)} disabled={value.participaEventos !== 'si'} />
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
