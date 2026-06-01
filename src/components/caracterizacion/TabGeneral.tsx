import { useEffect, useState } from 'react';
import type { FiltroItem, GuardarGeneralPayload, PestanaGeneralResponse, SemilleroCoordinador } from '../../types';
import { getAreasOcde, getCampus, getUnidades } from '../../api/semillerosApi';

interface TabGeneralProps {
  semillero: SemilleroCoordinador;
  initialData?: PestanaGeneralResponse | null;
  onDraftChange?: (payload: GuardarGeneralPayload | null) => void;
  onSave: (data: GuardarGeneralPayload) => Promise<void>;
  saving: boolean;
}

interface GeneralForm {
  nombre: string;
  siglas: string;
  correoSemillero: string;
  telefono: string;
  anioCreacion: string;
  mision: string;
  vision: string;
  objetivo: string;
  lineasInvestigacion: string;
  palabrasClave: string;
  grupoInvestigacion: string;
  idUnidadAcademica: string;
  idCampus: string;
  idAreaOcde: string;
}

const EMPTY: GeneralForm = {
  nombre: '', siglas: '', correoSemillero: '', telefono: '', anioCreacion: '',
  mision: '', vision: '', objetivo: '', lineasInvestigacion: '',
  palabrasClave: '', grupoInvestigacion: '',
  idUnidadAcademica: '', idCampus: '', idAreaOcde: '',
};

type Errors = Partial<Record<keyof GeneralForm, string>>;

function req(_label: string) {
  return <> <span style={{ color: '#e53e3e' }}>*</span></>;
}
function FieldErr({ msg }: { msg?: string }) {
  return msg ? <div className="invalid-feedback d-block" style={{ fontSize: '0.78rem' }}>{msg}</div> : null;
}

export default function TabGeneral({ semillero, initialData, onDraftChange, onSave, saving }: TabGeneralProps) {
  const [form, setForm] = useState<GeneralForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [unidades, setUnidades] = useState<FiltroItem[]>([]);
  const [campus, setCampus] = useState<FiltroItem[]>([]);
  const [areas, setAreas] = useState<FiltroItem[]>([]);
  const [loadingFiltros, setLoadingFiltros] = useState(true);

  // Load filter lists and pre-populate from semillero
  useEffect(() => {
    Promise.all([getUnidades(), getCampus(), getAreasOcde()])
      .then(([u, c, a]) => {
        setUnidades(u);
        setCampus(c);
        setAreas(a);
        const data = initialData;
        setForm({
          nombre: data?.nombre ?? semillero.nombre ?? '',
          siglas: data?.siglas ?? semillero.siglas ?? '',
          correoSemillero: data?.correoSemillero ?? semillero.correoSemillero ?? '',
          telefono: data?.telefono ?? semillero.telefono ?? '',
          anioCreacion: (data?.anioCreacion ?? semillero.anioCreacion)?.toString() ?? '',
          mision: data?.mision ?? semillero.mision ?? '',
          vision: data?.vision ?? semillero.vision ?? '',
          objetivo: data?.objetivo ?? semillero.objetivo ?? '',
          lineasInvestigacion: data?.lineasInvestigacion ?? semillero.lineasInvestigacion ?? '',
          palabrasClave: data?.palabrasClave ?? semillero.palabrasClave ?? '',
          grupoInvestigacion: data?.grupoInvestigacion ?? semillero.grupoInvestigacion ?? '',
          idUnidadAcademica: data?.idUnidadAcademica?.toString() ?? u.find(x => x.nombre === semillero.facultad)?.id.toString() ?? '',
          idCampus: data?.idCampus?.toString() ?? c.find(x => x.nombre === semillero.campus)?.id.toString() ?? '',
          idAreaOcde: data?.idAreaOcde?.toString() ?? a.find(x => x.nombre === semillero.areaOcde)?.id.toString() ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoadingFiltros(false));
  }, [initialData, semillero]);

  const set = (field: keyof GeneralForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  function buildPayload(): GuardarGeneralPayload | null {
    if (!form.nombre.trim()) return null;
    if (!form.correoSemillero.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correoSemillero)) return null;
    if (!form.mision.trim()) return null;
    if (!form.vision.trim()) return null;
    if (!form.objetivo.trim()) return null;
    if (!form.idUnidadAcademica || !form.idCampus || !form.idAreaOcde) return null;

    return {
      nombre: form.nombre.trim(),
      siglas: form.siglas.trim() || undefined,
      correoSemillero: form.correoSemillero.trim(),
      telefono: form.telefono.trim() || undefined,
      anioCreacion: form.anioCreacion ? parseInt(form.anioCreacion) : undefined,
      mision: form.mision.trim(),
      vision: form.vision.trim(),
      objetivo: form.objetivo.trim(),
      lineasInvestigacion: form.lineasInvestigacion.trim() || undefined,
      palabrasClave: form.palabrasClave.trim() || undefined,
      grupoInvestigacion: form.grupoInvestigacion.trim() || undefined,
      idUnidadAcademica: parseInt(form.idUnidadAcademica),
      idCampus: parseInt(form.idCampus),
      idAreaOcde: parseInt(form.idAreaOcde),
    };
  }

  useEffect(() => {
    onDraftChange?.(buildPayload());
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const e: Errors = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!form.correoSemillero.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correoSemillero))
      e.correoSemillero = 'Ingrese un correo válido.';
    if (!form.mision.trim()) e.mision = 'La misión es obligatoria.';
    if (!form.vision.trim()) e.vision = 'La visión es obligatoria.';
    if (!form.objetivo.trim()) e.objetivo = 'El objetivo es obligatorio.';
    if (!form.idUnidadAcademica) e.idUnidadAcademica = 'Seleccione la unidad académica.';
    if (!form.idCampus) e.idCampus = 'Seleccione el campus.';
    if (!form.idAreaOcde) e.idAreaOcde = 'Seleccione el área OCDE.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const payload = buildPayload();
    if (payload) await onSave(payload);
  }

  const fc = (field: keyof GeneralForm) =>
    `form-control form-control-sm${errors[field] ? ' is-invalid' : ''}`;
  const sc = (field: keyof GeneralForm) =>
    `form-select form-select-sm${errors[field] ? ' is-invalid' : ''}`;

  if (loadingFiltros) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: 'var(--udea-verde-principal)' }}></div>
        <p className="mt-2 small text-muted">Cargando datos del formulario...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-2 rounded mb-3 fw-semibold text-white small" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))' }}>
        📋 Información del Semillero y Contacto
      </div>

      {/* Row 1: nombre, siglas, correo */}
      <div className="row g-3 mb-3">
        <div className="col-md-5">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Nombre del semillero{req('')}
          </label>
          <input type="text" className={fc('nombre')} placeholder="Ej. Semillero de Robótica"
            value={form.nombre} onChange={e => set('nombre', e.target.value)} maxLength={300} />
          <FieldErr msg={errors.nombre} />
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Siglas</label>
          <input type="text" className={fc('siglas')} placeholder="SEROBOT"
            value={form.siglas} onChange={e => set('siglas', e.target.value)} maxLength={30} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Correo del semillero{req('')}
          </label>
          <input type="email" className={fc('correoSemillero')} placeholder="semillero@udea.edu.co"
            value={form.correoSemillero} onChange={e => set('correoSemillero', e.target.value)} />
          <FieldErr msg={errors.correoSemillero} />
        </div>
      </div>

      {/* Row 2: teléfono, año, grupo */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Teléfono</label>
          <input type="tel" className={fc('telefono')} placeholder="Número de contacto"
            value={form.telefono} onChange={e => set('telefono', e.target.value)} maxLength={20} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Año de creación</label>
          <input type="number" className={fc('anioCreacion')} placeholder="Ej. 2020"
            value={form.anioCreacion} onChange={e => set('anioCreacion', e.target.value)} min={1900} max={2100} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Grupo de investigación</label>
          <input type="text" className={fc('grupoInvestigacion')} placeholder="Nombre del grupo"
            value={form.grupoInvestigacion} onChange={e => set('grupoInvestigacion', e.target.value)} maxLength={200} />
        </div>
      </div>

      {/* Row 3: unidad, campus, area */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Unidad académica{req('')}
          </label>
          <select className={sc('idUnidadAcademica')} value={form.idUnidadAcademica} onChange={e => set('idUnidadAcademica', e.target.value)}>
            <option value="">Seleccione...</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.siglas ? `${u.siglas} – ` : ''}{u.nombre}</option>)}
          </select>
          <FieldErr msg={errors.idUnidadAcademica} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Campus{req('')}
          </label>
          <select className={sc('idCampus')} value={form.idCampus} onChange={e => set('idCampus', e.target.value)}>
            <option value="">Seleccione...</option>
            {campus.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <FieldErr msg={errors.idCampus} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
            Área OCDE{req('')}
          </label>
          <select className={sc('idAreaOcde')} value={form.idAreaOcde} onChange={e => set('idAreaOcde', e.target.value)}>
            <option value="">Seleccione...</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <FieldErr msg={errors.idAreaOcde} />
        </div>
      </div>

      <div className="p-2 rounded mb-3 fw-semibold text-white small mt-4" style={{ background: 'linear-gradient(135deg, #8faa5c, var(--udea-verde-medio))' }}>
        📝 Información Institucional
      </div>

      {/* Misión */}
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
          Misión{req('')}
        </label>
        <textarea className={fc('mision')} rows={3} placeholder="Describa la misión del semillero..."
          value={form.mision} onChange={e => set('mision', e.target.value)} />
        <FieldErr msg={errors.mision} />
      </div>

      {/* Visión */}
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
          Visión{req('')}
        </label>
        <textarea className={fc('vision')} rows={3} placeholder="Describa la visión del semillero..."
          value={form.vision} onChange={e => set('vision', e.target.value)} />
        <FieldErr msg={errors.vision} />
      </div>

      {/* Objetivo */}
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>
          Objetivo general{req('')}
        </label>
        <textarea className={fc('objetivo')} rows={3} placeholder="Describa el objetivo general del semillero..."
          value={form.objetivo} onChange={e => set('objetivo', e.target.value)} />
        <FieldErr msg={errors.objetivo} />
      </div>

      {/* Líneas e investigación */}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Líneas de investigación</label>
          <textarea className={fc('lineasInvestigacion')} rows={2} placeholder="Ej. Inteligencia Artificial, IoT..."
            value={form.lineasInvestigacion} onChange={e => set('lineasInvestigacion', e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Palabras clave</label>
          <textarea className={fc('palabrasClave')} rows={2} placeholder="Ej. machine learning, datos, IoT..."
            value={form.palabrasClave} onChange={e => set('palabrasClave', e.target.value)} maxLength={500} />
        </div>
      </div>

      {/* Action */}
      <div className="d-flex justify-content-end mt-4 pt-3" style={{ borderTop: '1px solid var(--udea-gris)' }}>
        <button
          type="button"
          className="btn btn-sm fw-semibold px-4"
          style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
          Guardar y Continuar →
        </button>
      </div>
    </div>
  );
}
