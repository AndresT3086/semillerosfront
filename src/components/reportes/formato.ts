import type { TipoUnidad } from '../../api/reportesApi';

// RN11/RN22: paleta institucional (verdes, turquesa y amarillo) alternada en los gráficos.
export const COLORES = ['#006d5b', '#7c9640', '#00a79d', '#b4d400', '#287843', '#68a79a', '#a6bb62', '#00b5ad', '#7dbe46'];

export const numero = (valor: number) => valor.toLocaleString('es-CO');
export const porcentaje = (valor: number) => `${valor.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

export function variacion(valor: number | undefined, unidad = '%') {
  if (valor === undefined) return null;
  const texto = valor.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${valor > 0 ? '+' : ''}${texto} ${unidad}`;
}

export const NOMBRE_TIPO: Record<TipoUnidad, string> = {
  FACULTAD: 'Facultad', ESCUELA: 'Escuela', INSTITUTO: 'Instituto', CORPORACION: 'Corporación', SECCIONAL: 'Seccional', OTRA: 'Otra',
};
