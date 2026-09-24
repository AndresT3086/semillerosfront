// Solo decide la navegación. La autorización de las operaciones corresponde al backend.
export function isAdminToken(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return claims.rol === 'ADMIN';
  } catch {
    return false;
  }
}
