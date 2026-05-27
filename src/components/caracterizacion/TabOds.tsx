import type { OdsFormData } from '../../types';

interface Props {
  value: OdsFormData;
  onChange: (value: OdsFormData) => void;
  onSave: () => void;
  onPrev: () => void;
  saving: boolean;
  onFinalizar: () => void;
  canFinalizar: boolean;
  finalizado: boolean;
}

const ODS_LIST = [
  { id: 1, label: '1. Fin de la pobreza' },
  { id: 2, label: '2. Hambre cero' },
  { id: 3, label: '3. Salud y bienestar' },
  { id: 4, label: '4. Educación de calidad' },
  { id: 5, label: '5. Igualdad de género' },
  { id: 6, label: '6. Agua limpia y saneamiento' },
  { id: 7, label: '7. Energía asequible y no contaminante' },
  { id: 8, label: '8. Trabajo decente y crecimiento económico' },
  { id: 9, label: '9. Industria, innovación e infraestructura' },
  { id: 10, label: '10. Reducción de las desigualdades' },
  { id: 11, label: '11. Ciudades y comunidades sostenibles' },
  { id: 12, label: '12. Producción y consumo responsables' },
  { id: 13, label: '13. Acción por el clima' },
  { id: 14, label: '14. Vida submarina' },
  { id: 15, label: '15. Vida de ecosistemas terrestres' },
  { id: 16, label: '16. Paz, justicia e instituciones sólidas' },
  { id: 17, label: '17. Alianzas para lograr los objetivos' },
];

const AREAS_OCDE = ['Ciencias Naturales', 'Ingeniería y Tecnología', 'Ciencias Médicas y de la Salud',
  'Ciencias Agrícolas', 'Ciencias Sociales', 'Humanidades'];

export default function TabOds({ value, onChange, onSave, onPrev, saving, onFinalizar, canFinalizar, finalizado }: Props) {
  const set = (field: keyof OdsFormData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div>
      <div className="p-2 rounded mb-3 fw-semibold text-white small" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))' }}>
        🌍 Áreas OCDE y ODS
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Área OCDE <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <select className="form-select form-select-sm" value={value.areaOcde} onChange={e => set('areaOcde', e.target.value)}>
            <option value="">Seleccione...</option>
            {AREAS_OCDE.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Sub-área OCDE</label>
          <input type="text" className="form-control form-control-sm" placeholder="Ej. Computación, Química..."
            value={value.subArea} onChange={e => set('subArea', e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>ODS principal</label>
          <select className="form-select form-select-sm" value={value.odsPrincipal} onChange={e => set('odsPrincipal', e.target.value)}>
            <option value="">Seleccione...</option>
            {ODS_LIST.map(o => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Observaciones finales</label>
        <textarea className="form-control form-control-sm" rows={3}
          placeholder="Información adicional relevante sobre el semillero..."
          value={value.observaciones} onChange={e => set('observaciones', e.target.value)} />
      </div>

      {/* Finalizar info */}
      {canFinalizar && !finalizado && (
        <div className="alert py-2 small mb-3" style={{ background: 'rgba(180, 212, 0, 0.15)', borderColor: 'var(--udea-verde-amarillo)', color: 'var(--udea-verde-oscuro)' }}>
          <i className="bi bi-info-circle me-2"></i>
          Si ya completó todas las secciones, puede finalizar la caracterización. El administrador recibirá una notificación.
        </div>
      )}
      {finalizado && (
        <div className="alert py-2 small mb-3 text-center fw-semibold" style={{ background: 'rgba(0,181,173,0.12)', borderColor: 'var(--udea-turquesa)', color: 'var(--udea-verde-oscuro)' }}>
          <i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--udea-turquesa)' }}></i>
          Caracterización finalizada exitosamente. El administrador ha sido notificado.
        </div>
      )}

      <div className="d-flex justify-content-between mt-2 pt-3" style={{ borderTop: '1px solid var(--udea-gris)' }}>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onPrev}>← Anterior</button>
        <div className="d-flex gap-2">
          {!finalizado && (
            <button type="button" className="btn btn-sm fw-semibold px-4"
              style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white' }}
              onClick={onSave} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              Guardar
            </button>
          )}
          {canFinalizar && !finalizado && (
            <button type="button" className="btn btn-success btn-sm fw-semibold px-4"
              onClick={onFinalizar} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              ✓ Finalizar Caracterización
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
