import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentForm from '../components/molecules/comment-form';
import { useAuth } from '../context/auth-context';
import { useComments } from '../context/comments-context';

// Mock de los contextos
jest.mock('../context/auth-context');
jest.mock('../context/comments-context', () => ({
  useComments: jest.fn()
}));

describe('CommentForm - Formulario de Comentarios', () => {
  // Setup del usuario para userEvent
  const user = userEvent.setup();
  
  // Mocks comunes
  const mockAddComment = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddComment.mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ user: { userName: 'TestUser' } });
    (useComments as jest.Mock).mockReturnValue({ addComment: mockAddComment });
  });

  it('renderiza el textarea y el botón', () => {
    render(<CommentForm />);
    expect(screen.getByLabelText(/Añadir comentario/i)).toBeInTheDocument();
    expect(screen.getByText(/Publicar comentario/i)).toBeInTheDocument();
  });

  it('no permite enviar si el texto está vacío', () => {
    render(<CommentForm />);
    expect(screen.getByRole('button', { name: /Publicar comentario/i })).toBeDisabled();
  });

  it('habilita el botón cuando se escribe texto', async () => {
    render(<CommentForm />);
    const textarea = screen.getByLabelText(/Añadir comentario/i);
    const submitButton = screen.getByRole('button', { name: /Publicar comentario/i });
    
    expect(submitButton).toBeDisabled();
    await user.type(textarea, 'Nuevo comentario');
    expect(submitButton).not.toBeDisabled();
  });

  it('maneja el envío del formulario correctamente', async () => {
    render(<CommentForm />);
    const textarea = screen.getByLabelText(/Añadir comentario/i);
    const submitButton = screen.getByRole('button', { name: /Publicar comentario/i });
    
    await user.type(textarea, 'Nuevo comentario de prueba');
    await user.click(submitButton);
    
    expect(mockAddComment).toHaveBeenCalledWith('Nuevo comentario de prueba', null);
    
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('muestra estado de carga durante el envío', async () => {
    mockAddComment.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<CommentForm />);
    const textarea = screen.getByLabelText(/Añadir comentario/i);
    const submitButton = screen.getByRole('button', { name: /Publicar comentario/i });
    
    await user.type(textarea, 'Comentario de prueba');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(textarea).toBeDisabled();
    expect(screen.getByText(/Publicando/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(textarea).not.toBeDisabled();
      expect(textarea).toHaveValue('');
    });
  });
});
