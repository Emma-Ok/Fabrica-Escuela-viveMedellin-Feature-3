import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentsSection from '../components/organisms/comments-section';
import { useComments } from '../context/comments-context';
import { useAuth } from '../context/auth-context';
import type { Comment } from '@/context/comments-context';

jest.mock('../context/comments-context');
jest.mock('../context/auth-context');

describe('CommentsSection', () => {
  const mockRefreshComments = jest.fn();
  const mockToggleShowAllComments = jest.fn();
  
  const mockComments: Comment[] = [
    {
      id: '1',
      text: 'Comentario 1',
      author: { id: '1', name: 'User1', avatar: '', initials: 'U1' },
      createdAt: new Date().toISOString(),
      reportCount: 0,
      isHidden: false,
      replies: [],
      parentCommentId: null
    },
    {
      id: '2',
      text: 'Comentario 2',
      author: { id: '2', name: 'User2', avatar: '', initials: 'U2' },
      createdAt: new Date().toISOString(),
      reportCount: 0,
      isHidden: false,
      replies: [],
      parentCommentId: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useComments as jest.Mock).mockReturnValue({
      comments: [],
      visibleComments: [],
      showAllComments: false,
      toggleShowAllComments: mockToggleShowAllComments,
      refreshComments: mockRefreshComments,
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });
  });

  it('muestra mensaje cuando no hay comentarios y no está autenticado', () => {
    render(<CommentsSection />);
    expect(screen.getByText(/Aún no hay comentarios/i)).toBeInTheDocument();
    expect(screen.getByText(/Inicia sesión para participar/i)).toBeInTheDocument();
  });

  it('muestra mensaje para usuario autenticado sin comentarios', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true,
      user: { id: '1', userName: 'TestUser' }
    });
    render(<CommentsSection />);
    expect(screen.getByText(/¡Sé el primero en comentar!/i)).toBeInTheDocument();
  });  it('muestra el botón de refrescar y maneja el estado de carga', async () => {
    const mockPromise = new Promise<void>(resolve => setTimeout(resolve, 100));
    mockRefreshComments.mockReturnValue(mockPromise);
    
    render(<CommentsSection />);
    const refreshButton = screen.getByRole('button', { name: /Refrescar/i });
    
    // Estado inicial
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).not.toBeDisabled();
    expect(refreshButton).toHaveTextContent('Refrescar');
    
    // Clic en el botón
    fireEvent.click(refreshButton);
    
    // Verificar estado de carga inmediatamente después del clic
    expect(refreshButton).toBeDisabled();
    expect(refreshButton).toHaveTextContent('Actualizando...');
    
    // Esperar a que termine la operación
    await waitFor(() => {
      expect(mockRefreshComments).toHaveBeenCalledTimes(1);
    });
    
    // Verificar estado final
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
      expect(refreshButton).toHaveTextContent('Refrescar');
    });
  });

  it('muestra la lista de comentarios correctamente', () => {
    (useComments as jest.Mock).mockReturnValue({
      comments: mockComments,
      visibleComments: mockComments,
      showAllComments: false,
      toggleShowAllComments: mockToggleShowAllComments,
      refreshComments: mockRefreshComments,
    });

    render(<CommentsSection />);
    expect(screen.getByText('Comentario 1')).toBeInTheDocument();
    expect(screen.getByText('Comentario 2')).toBeInTheDocument();
  });

  it('maneja el toggle de mostrar más/menos comentarios', () => {
    const manyComments = Array.from({ length: 5 }, (_, i) => ({
      ...mockComments[0],
      id: i + 1,
      text: `Comentario ${i + 1}`
    }));

    (useComments as jest.Mock).mockReturnValue({
      comments: manyComments,
      visibleComments: manyComments.slice(0, 3),
      showAllComments: false,
      toggleShowAllComments: mockToggleShowAllComments,
      refreshComments: mockRefreshComments,
    });

    render(<CommentsSection />);
    const toggleButton = screen.getByText(/Ver más comentarios/i);
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(mockToggleShowAllComments).toHaveBeenCalled();
  });

  it('muestra el número correcto de comentarios', () => {
    const comments = Array.from({ length: 3 }, (_, i) => ({
      id: `${i + 1}`,
      text: `Comentario ${i + 1}`,
      author: { id: `${i + 1}`, name: `User${i + 1}`, avatar: '', initials: `U${i + 1}` },
      createdAt: new Date().toISOString(),
      reportCount: 0,
      isHidden: false,
      replies: [],
      parentCommentId: null
    }));

    (useComments as jest.Mock).mockReturnValue({
      comments,
      visibleComments: comments,
      showAllComments: false,
      toggleShowAllComments: mockToggleShowAllComments,
      refreshComments: mockRefreshComments,
    });

    render(<CommentsSection />);
    expect(screen.getByText('Comentarios (3)')).toBeInTheDocument();
  });
});
