import { render, screen } from '@testing-library/react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/auth-context';
import { useNotifications } from '../context/notifications-context';

jest.mock('../context/auth-context');
jest.mock('../context/notifications-context');
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ login: jest.fn() });
    (useNotifications as jest.Mock).mockReturnValue({ addNotification: jest.fn() });
  });

  it('renderiza inputs de email y contraseña', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
  });
});
