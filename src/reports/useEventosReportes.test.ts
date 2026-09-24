import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { escucharEventosReportes } from '../api/reportesApi';
import { REINTENTO_MS, useEventosReportes } from './useEventosReportes';

vi.mock('../api/reportesApi', () => ({ escucharEventosReportes: vi.fn() }));
beforeEach(() => { vi.useFakeTimers(); vi.resetAllMocks(); });
afterEach(() => vi.useRealTimers());

it('reintenta la conexión tras un error y vuelve a conectarse', async () => {
  vi.mocked(escucharEventosReportes).mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce((_token, onEvento) => { onEvento({ evento: 'conectado', datos: '{}' }); return new Promise(() => {}); });
  const { result } = renderHook(() => useEventosReportes('tok', true, () => {}));
  await act(async () => { await Promise.resolve(); });
  expect(result.current).toBe('error');
  await act(async () => { vi.advanceTimersByTime(REINTENTO_MS); });
  expect(escucharEventosReportes).toHaveBeenCalledTimes(2);
  expect(result.current).toBe('conectado');
});

it('se reconecta cuando el servidor cierra el flujo y se detiene al desmontar', async () => {
  vi.mocked(escucharEventosReportes).mockResolvedValueOnce(undefined).mockReturnValue(new Promise(() => {}));
  const { unmount } = renderHook(() => useEventosReportes('tok', true, () => {}));
  await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(1_000); });
  expect(escucharEventosReportes).toHaveBeenCalledTimes(2);
  const signal = vi.mocked(escucharEventosReportes).mock.calls[1][2];
  unmount();
  expect(signal.aborted).toBe(true);
});

it('no se conecta si está inactivo o no hay token', () => {
  const { result } = renderHook(() => useEventosReportes(undefined, true, () => {}));
  expect(result.current).toBe('inactivo');
  expect(escucharEventosReportes).not.toHaveBeenCalled();
});
