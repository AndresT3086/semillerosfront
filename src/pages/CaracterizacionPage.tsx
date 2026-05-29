import { useEffect, useState } from 'react';
import type { CaracterizacionDraft, GuardarGeneralPayload, SemilleroCoordinador } from '../types';
import {
  finalizarCaracterizacion,
  getSemilleroCoordinadorById,
  guardarPestanaGeneral,
} from '../api/semillerosApi';
import TabGeneral from '../components/caracterizacion/TabGeneral';
import TabProduccion from '../components/caracterizacion/TabProduccion';
import TabOrganizacion from '../components/caracterizacion/TabOrganizacion';
import TabRelacionamiento from '../components/caracterizacion/TabRelacionamiento';
import TabActividades from '../components/caracterizacion/TabActividades';
import TabDofa from '../components/caracterizacion/TabDofa';
import TabOds from '../components/caracterizacion/TabOds';

interface Props {
  token: string;
  correoCoordinador: string;
  semilleroId: number;
  onBack: () => void;
  onLogout: () => void;
}

const TABS = [
  { label: 'General', icon: '📋' },
  { label: 'Producción', icon: '📚' },
  { label: 'Organización', icon: '🏢' },
  { label: 'Relacionamiento', icon: '🤝' },
  { label: 'Actividades', icon: '🔬' },
  { label: 'DOFA', icon: '📊' },
  { label: 'ODS', icon: '🌍' },
];

const DRAFT_VERSION = 1;

const EMPTY_DRAFT: CaracterizacionDraft = {
  produccion: {
    tieneArticulos: '',
    cantArticulos: '',
    tieneLibros: '',
    cantLibros: '',
    organizaEventos: '',
    cantEventos: '',
    participaEventos: '',
    cantParticipaciones: '',
  },
  organizacion: {
    recursos: [],
    fuentes: [],
  },
  relacionamiento: {
    adscrito: '',
    grupo: '',
    relacionGrupo: '',
    centro: '',
    relacionCentro: '',
    departamento: '',
    relacionDept: '',
    facultad: '',
    relacionFacultad: '',
  },
  actividades: {
    clubes: '',
    seminarios: '',
    salidas: '',
    talleres: '',
    conversatorios: '',
    jornadas: '',
    redColsi: '',
    ponNac: '',
    ponInt: '',
  },
  dofa: {
    fortalezas: '',
    debilidades: '',
    oportunidades: '',
    amenazas: '',
  },
  ods: {
    areaOcde: '',
    subArea: '',
    odsPrincipal: '',
    observaciones: '',
  },
};

function draftStorageKey(semilleroId: number) {
  return `sigsi:caracterizacion:${DRAFT_VERSION}:${semilleroId}`;
}

function loadLocalDraft(semilleroId: number): CaracterizacionDraft {
  try {
    const raw = window.sessionStorage.getItem(draftStorageKey(semilleroId));
    if (!raw) return EMPTY_DRAFT;
    return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    return EMPTY_DRAFT;
  }
}

export default function CaracterizacionPage({
  token,
  correoCoordinador,
  semilleroId,
  onBack,
  onLogout,
}: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [semillero, setSemillero] = useState<SemilleroCoordinador | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTabs, setSavedTabs] = useState<Set<number>>(new Set());
  const [finalizado, setFinalizado] = useState(false);
  const [finalizandoMsg, setFinalizandoMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<CaracterizacionDraft>(() => loadLocalDraft(semilleroId));

  useEffect(() => {
    loadSemillero();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.sessionStorage.setItem(draftStorageKey(semilleroId), JSON.stringify(draft));
  }, [draft, semilleroId]);

  function updateDraft<K extends keyof CaracterizacionDraft>(section: K, value: CaracterizacionDraft[K]) {
    setDraft(prev => ({ ...prev, [section]: value }));
  }

  async function loadSemillero() {
    setLoading(true);
    setError(null);
    setSavedTabs(new Set());
    setFinalizado(false);
    setFinalizandoMsg(null);
    try {
      const s = await getSemilleroCoordinadorById(semilleroId, token);
      setSemillero(s);
      if (s.estadoCaracterizacion === 'COMPLETO') setFinalizado(true);
      if (s.estadoCaracterizacion && s.estadoCaracterizacion !== 'GENERAL_PENDIENTE') {
        setSavedTabs(prev => new Set([...prev, 0]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la caracterización.');
    } finally {
      setLoading(false);
    }
  }

  // ── Tab 0 (General) → real API ────────────────────────────────────────────
  async function handleSaveGeneral(payload: GuardarGeneralPayload) {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await guardarPestanaGeneral(semillero.id, payload, token);
      setSemillero(updated);
      setSavedTabs(prev => new Set([...prev, 0]));
      setActiveTab(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la pestaña General.');
    } finally {
      setSaving(false);
    }
  }

  // ── Tabs 1-6 keep a local draft until backend endpoints exist ─────────────
  async function handleSaveDraft(tabIndex: number) {
    setSaving(true);
    setError(null);
    try {
      setSavedTabs(prev => new Set([...prev, tabIndex]));
      setActiveTab(tabIndex + 1);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOds() {
    setSaving(true);
    setError(null);
    try {
      setSavedTabs(prev => new Set([...prev, 6]));
    } finally {
      setSaving(false);
    }
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────
  async function handleFinalizar() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    setFinalizandoMsg(null);
    try {
      const result = await finalizarCaracterizacion(semillero.id, token);
      setSemillero(result);
      setFinalizado(true);
      setFinalizandoMsg('Caracterización finalizada. El administrador ha sido notificado por correo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar la caracterización.');
    } finally {
      setSaving(false);
    }
  }

  const canFinalizar = savedTabs.size === TABS.length && !finalizado;

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ color: 'var(--udea-verde-principal)', width: 48, height: 48 }}></div>
          <p className="text-muted">Cargando caracterización...</p>
        </div>
      </div>
    );
  }

  if (!semillero) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error ?? 'No se pudo cargar el semillero.'}</div>
        <button className="btn btn-outline-secondary" onClick={onBack}>Volver</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fcf9 0%, #eef5f1 100%)' }}>
      {/* Header */}
      <div className="udea-header" style={{ borderRadius: '0 0 12px 12px', marginBottom: 0, paddingBottom: '1rem' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="udea-logo mb-1" style={{ fontSize: '1.5rem' }}>UdeA <span>SIGSI</span></h1>
              <span className="sigsi-badge">CARACTERIZACIÓN DE SEMILLERO</span>
            </div>
            <div className="col-auto text-end">
              <div className="small text-white opacity-75 mb-1">
                <i className="bi bi-shield-check me-1"></i>{correoCoordinador}
              </div>
              <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                <i className="bi bi-box-arrow-left me-1"></i>Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4" style={{ maxWidth: 960 }}>
        <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Mis semilleros
        </button>

        {/* Código del semillero */}
        <div className="d-flex align-items-center justify-content-between p-3 rounded mb-3 text-white fw-semibold"
          style={{ background: 'linear-gradient(135deg, var(--udea-verde-medio), var(--udea-verde-oscuro))' }}>
          <span><i className="bi bi-qr-code-scan me-2"></i>Código del semillero:</span>
          <span className="px-3 py-1 rounded fw-bold" style={{ background: 'white', color: 'var(--udea-verde-oscuro)', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: 2 }}>
            {semillero.codigo}
          </span>
        </div>

        {/* Error global */}
        {error && (
          <div className="alert alert-danger py-2 small mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>{error}
          </div>
        )}

        {/* Finalizar success */}
        {finalizandoMsg && (
          <div className="alert py-2 small mb-3 fw-semibold text-center"
            style={{ background: 'rgba(0,181,173,0.12)', borderColor: 'var(--udea-turquesa)', color: 'var(--udea-verde-oscuro)' }}>
            <i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--udea-turquesa)' }}></i>
            {finalizandoMsg}
          </div>
        )}

        {/* Card con tabs */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
          {/* Tab navigation */}
          <div className="d-flex flex-wrap gap-1 p-2 pb-0" style={{ background: 'white', borderBottom: '3px solid var(--udea-verde-principal)' }}>
            {TABS.map((tab, i) => (
              <button
                key={i}
                type="button"
                className="btn btn-sm fw-semibold"
                style={{
                  borderRadius: '8px 8px 0 0',
                  fontSize: '0.78rem',
                  padding: '6px 12px',
                  background: activeTab === i
                    ? 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))'
                    : 'var(--udea-gris-claro)',
                  color: activeTab === i ? 'white' : 'var(--udea-verde-oscuro)',
                  border: 'none',
                  position: 'relative',
                }}
                onClick={() => setActiveTab(i)}
              >
                {tab.icon} {tab.label}
                {savedTabs.has(i) && (
                  <span className="ms-1" style={{ color: activeTab === i ? 'rgba(255,255,255,0.9)' : 'var(--udea-verde-medio)', fontSize: '0.7rem' }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Indicator */}
          <div className="px-3 py-1 small" style={{ background: 'var(--udea-gris-claro)', color: 'var(--udea-verde-oscuro)', fontWeight: 600 }}>
            <i className="bi bi-grid-3x3-gap-fill me-2"></i>
            Pestaña {activeTab + 1} de {TABS.length}
            {' · '}
            <span style={{ color: savedTabs.size > 0 ? 'var(--udea-verde-medio)' : undefined }}>
              {savedTabs.size}/{TABS.length} secciones guardadas
            </span>
            {finalizado && (
              <span className="ms-2 badge" style={{ background: 'var(--udea-turquesa)', color: 'white' }}>CARACTERIZADO ✓</span>
            )}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 0 && (
              <TabGeneral semillero={semillero} onSave={handleSaveGeneral} saving={saving} />
            )}
            {activeTab === 1 && (
              <TabProduccion
                value={draft.produccion}
                onChange={value => updateDraft('produccion', value)}
                onSave={() => handleSaveDraft(1)}
                onPrev={() => setActiveTab(0)}
                saving={saving}
              />
            )}
            {activeTab === 2 && (
              <TabOrganizacion
                value={draft.organizacion}
                onChange={value => updateDraft('organizacion', value)}
                onSave={() => handleSaveDraft(2)}
                onPrev={() => setActiveTab(1)}
                saving={saving}
              />
            )}
            {activeTab === 3 && (
              <TabRelacionamiento
                value={draft.relacionamiento}
                onChange={value => updateDraft('relacionamiento', value)}
                onSave={() => handleSaveDraft(3)}
                onPrev={() => setActiveTab(2)}
                saving={saving}
              />
            )}
            {activeTab === 4 && (
              <TabActividades
                value={draft.actividades}
                onChange={value => updateDraft('actividades', value)}
                onSave={() => handleSaveDraft(4)}
                onPrev={() => setActiveTab(3)}
                saving={saving}
              />
            )}
            {activeTab === 5 && (
              <TabDofa
                value={draft.dofa}
                onChange={value => updateDraft('dofa', value)}
                onSave={() => handleSaveDraft(5)}
                onPrev={() => setActiveTab(4)}
                saving={saving}
              />
            )}
            {activeTab === 6 && (
              <TabOds
                value={draft.ods}
                onChange={value => updateDraft('ods', value)}
                onSave={handleSaveOds}
                onPrev={() => setActiveTab(5)}
                saving={saving}
                onFinalizar={handleFinalizar}
                canFinalizar={canFinalizar}
                finalizado={finalizado}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
