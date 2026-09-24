import { useEffect, useRef, useState } from 'react';
import { escucharEventosReportes } from '../api/reportesApi';

export type EstadoEventos = 'inactivo' | 'conectando' | 'conectado' | 'error';
export const REINTENTO_MS = 15_000;

// HU13: mantiene una conexión SSE con el backend y avisa cuando cambian los datos.
// Si la conexión se cierra (vencimiento) o falla, se reintenta sin afectar los datos mostrados (RN48).
export function useEventosReportes(token: string | undefined, activo: boolean, onActualizado: () => void): EstadoEventos {
  const [estado, setEstado] = useState<Exclude<EstadoEventos, 'inactivo'>>('conectando');
  const callback = useRef(onActualizado);
  useEffect(() => { callback.current = onActualizado; });

  useEffect(() => {
    if (!activo || !token) return undefined;
    const controller = new AbortController();
    let espera: number | undefined;
    const conectar = () => {
      escucharEventosReportes(token, evento => {
        if (evento.evento === 'conectado') setEstado('conectado');
        if (evento.evento === 'datos-actualizados') callback.current();
      }, controller.signal)
        .then(() => { if (!controller.signal.aborted) espera = window.setTimeout(conectar, 1_000); })
        .catch(() => {
          if (controller.signal.aborted) return;
          setEstado('error');
          espera = window.setTimeout(conectar, REINTENTO_MS);
        });
    };
    conectar();
    return () => { controller.abort(); window.clearTimeout(espera); };
  }, [token, activo]);

  return activo && token ? estado : 'inactivo';
}
