import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
vi.mock('../api/semillerosApi', () => ({ getCaptcha: vi.fn().mockResolvedValue({ operando1: 1, operando2: 2 }), loginCoordinador: vi.fn() }));
it('permite mostrar y ocultar la contraseña sin cambiarla ni enviar el formulario', async () => {
  const login = vi.fn();
  render(<LoginPage onLoginSuccess={login} onBack={() => {}} />);
  await screen.findByText('1 + 2 = ?');
  const input = screen.getByLabelText('Contraseña');
  fireEvent.change(input, { target: { value: 'Clave123456' } });
  expect(input).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveValue('Clave123456');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
  expect(input).toHaveAttribute('type', 'password');
  expect(login).not.toHaveBeenCalled();
});
