import { describe, expect, it } from 'vitest';
import { isAdminToken } from './role';
describe('Navegación por rol del JWT', () => {
  it('solo reconoce el rol ADMIN explícito', () => {
    const token = (rol?: string) => `header.${btoa(JSON.stringify({ rol }))}.signature`;
    expect(isAdminToken(token('ADMIN'))).toBe(true);
    expect(isAdminToken(token('COORDINADOR'))).toBe(false);
    expect(isAdminToken(token())).toBe(false);
    expect(isAdminToken('token-invalido')).toBe(false);
  });
});
