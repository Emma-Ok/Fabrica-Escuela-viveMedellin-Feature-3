import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from '../components/auth/RegisterForm';
import { useNotifications } from '../context/notifications-context';

jest.mock('../context/notifications-context');
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    (useNotifications as jest.Mock).mockReturnValue({ addNotification: jest.fn() });
  });

  it('renderiza inputs de registro', () => {
    render(<RegisterForm />);
    expect(screen.getByPlaceholderText(/Nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
  });
});
