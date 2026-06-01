// Respuesta resumida del listado de semilleros
export interface SemilleroResumen {
  id: number;
  codigo: string;
  nombre: string;
  siglas: string;
  facultad: string;
  campus: string;
  anioCreacion: number;
  grupoInvestigacion: string;
  totalSemilleristas: number;
  totalActividadesCientificas: number;
  estado: string;
}

// Respuesta detallada de un semillero individual
export interface SemilleroDetalle {
  id: number;
  codigo: string;
  nombre: string;
  siglas: string;
  correoSemillero: string;
  telefono: string;
  anioCreacion: number;
  mision: string;
  vision: string;
  objetivo: string;
  lineasInvestigacion: string;
  palabrasClave: string;
  grupoInvestigacion: string;
  facultad: string;
  campus: string;
  departamento?: string;
  areaOcde: string;
  ods?: string | string[];
  correoCoordinador?: string;
  estado: string;
  totalSemilleristas: number;
  totalActividadesCientificas: number;
}

// Item genérico para filtros (unidades, campus, áreas OCDE)
export interface FiltroItem {
  id: number;
  nombre: string;
  siglas: string;
}

// Respuesta paginada del backend
export interface PageResponse<T> {
  contenido: T[];
  paginaActual: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
  esUltimaPagina: boolean;
  esPrimeraPagina: boolean;
}

// Datos del formulario de inscripción (mapeados a InscripcionRequest del backend)
export interface InscripcionFormData {
  nombres: string;
  apellidos: string;
  cedula: string;
  correo: string;
  telefono: string;
  programa: string;
  semestre: string;
  motivacion: string;
  aceptaTerminos: boolean;
}

export type InscripcionFormErrors = Partial<Record<keyof InscripcionFormData, string>>;

// Filtros de búsqueda (usan IDs para enviar al backend)
export interface FilterValues {
  idUnidad: string;
  idArea: string;
  idCampus: string;
  q: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface CaptchaResponse {
  operando1: number;
  operando2: number;
  operacion: string;
  pregunta: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  correo: string;
  idCoordinador: number;
}

// ── Semillero del Coordinador ─────────────────────────────────────────────────
export interface SemilleroCoordinador {
  id: number;
  codigo: string;
  nombre: string | null;
  siglas: string | null;
  correoSemillero: string | null;
  telefono: string | null;
  anioCreacion: number | null;
  mision: string | null;
  vision: string | null;
  objetivo: string | null;
  lineasInvestigacion: string | null;
  palabrasClave: string | null;
  grupoInvestigacion: string | null;
  estado: string;
  estadoCaracterizacion: string | null;
  facultad: string | null;
  campus: string | null;
  areaOcde: string | null;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
}

export interface GuardarGeneralPayload {
  nombre: string;
  siglas?: string;
  correoSemillero: string;
  telefono?: string;
  anioCreacion?: number;
  mision: string;
  vision: string;
  objetivo: string;
  lineasInvestigacion?: string;
  palabrasClave?: string;
  grupoInvestigacion?: string;
  idUnidadAcademica: number;
  idCampus: number;
  idAreaOcde: number;
}

export type SiNo = 'si' | 'no' | '';

export interface PestanaGeneralResponse extends GuardarGeneralPayload {
  id: number;
  codigo: string;
  nombreUnidad: string | null;
  nombreCampus: string | null;
  nombreAreaOcde: string | null;
  estadoCaracterizacion: string | null;
}

export interface ProduccionFormData {
  tieneArticulos: SiNo;
  cantArticulos: string;
  tieneLibros: SiNo;
  cantLibros: string;
  organizaEventos: SiNo;
  cantEventos: string;
  participaEventos: SiNo;
  cantParticipaciones: string;
}

export interface GuardarProduccionPayload {
  tienenArticulos: boolean;
  cantidadArticulos: number;
  tienenLibros: boolean;
  cantidadLibros: number;
  organizanEventos: boolean;
  cantidadEventosOrganizados: number;
  participaEnEventos: boolean;
  cantidadParticipaciones: number;
}

export interface PestanaProduccionResponse {
  tienenArticulos: boolean | null;
  cantidadArticulos: number | null;
  tienenLibros: boolean | null;
  cantidadLibros: number | null;
  organizanEventos: boolean | null;
  cantidadEventos: number | null;
  participaEnEventos: boolean | null;
  cantidadParticipaciones: number | null;
}

export interface OrganizacionFormData {
  recursos: number[];
  fuentes: number[];
}

export interface PestanaOrganizacionResponse {
  recursosSeleccionados: FiltroItem[];
  fuentesSeleccionadas: FiltroItem[];
  todosLosRecursos: FiltroItem[];
  todasLasFuentes: FiltroItem[];
}

export interface GuardarOrganizacionPayload {
  idsRecursos: number[];
  idsFuentesFinanciacion: number[];
}

export interface RelacionamientoFormData {
  adscrito: SiNo;
  grupo: string;
  relacionGrupo: string;
  centro: string;
  relacionCentro: string;
  departamento: string;
  relacionDept: string;
  facultad: string;
  relacionFacultad: string;
}

export interface GuardarRelacionamientoPayload {
  adscritoGrupo: boolean;
  grupoInvestigacion?: string;
  relacionGrupo?: string;
  centroInvestigaciones?: string;
  relacionCentro?: string;
  departamento?: string;
  relacionDepartamento?: string;
  facultad?: string;
  relacionFacultad?: string;
}

export interface PestanaRelacionamientoResponse extends GuardarRelacionamientoPayload {}

export interface ActividadFormItem {
  idActividad: number;
  nombre: string;
  categoria: string;
  realiza: boolean;
}

export type ActividadesFormData = ActividadFormItem[];

export interface GuardarActividadesPayload {
  actividades: Array<{
    idActividad: number;
    realiza: boolean;
  }>;
}

export interface PestanaActividadesResponse {
  actividades: ActividadFormItem[];
}

export interface DofaFormData {
  fortalezas: string;
  debilidades: string;
  oportunidades: string;
  amenazas: string;
}

export interface GuardarDofaPayload extends DofaFormData {}
export interface PestanaDofaResponse extends DofaFormData {}

export interface OdsFormData {
  areaOcde: string;
  subArea: string;
  odsPrincipal: string;
  observaciones: string;
}

export interface GuardarOdsPayload {
  idAreaOcde: number;
  subAreaOcde?: string;
  idOdsPrincipal: number;
  observacionesFinales?: string;
}

export interface PestanaOdsResponse {
  idAreaOcde: number | null;
  nombreAreaOcde: string | null;
  subAreaOcde: string | null;
  idOdsPrincipal: number | null;
  nombreOdsPrincipal: string | null;
  observacionesFinales: string | null;
}

export interface CaracterizacionDraft {
  produccion: ProduccionFormData;
  organizacion: OrganizacionFormData;
  relacionamiento: RelacionamientoFormData;
  actividades: ActividadesFormData;
  dofa: DofaFormData;
  ods: OdsFormData;
}
