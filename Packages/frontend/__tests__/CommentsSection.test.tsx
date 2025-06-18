import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentsSection from '../components/organisms/comments-section';
import { useComments } from '../context/comments-context';
import { useAuth } from '../context/auth-context';
import type { Comment } from '@/context/comments-context';

/**
 * Mocks de los contextos necesarios para la sección de comentarios
 * - comments-context: Proporciona la lista de comentarios y funciones de manejo
 * - auth-context: Maneja el estado de autenticación del usuario
 */
jest.mock('../context/comments-context');
jest.mock('../context/auth-context');

describe('CommentsSection - Sección de Comentarios', () => {
  // Funciones mock para simular acciones de comentarios
  const mockRefreshComments = jest.fn();
  const mockToggleShowAllComments = jest.fn();
  
  /**
   * Datos de prueba: Lista de comentarios simulados
   * Cada comentario incluye:
   * - ID único
   * - Texto del comentario
   * - Información del autor
   * - Fecha de creación
   * - Estado de reportes y visibilidad
   */
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
  /**
   * Configuración antes de cada test
   * - Limpia todos los mocks para evitar efectos entre tests
   * - Configura el estado inicial de los comentarios (vacío)
   * - Configura el estado inicial de autenticación (no autenticado)
   */
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
  /**
   * Test: Visualización de comentarios y paginación
   * Verifica:
   * 1. Renderizado correcto de la lista de comentarios
   * 2. Funcionamiento del botón "ver más"
   * 3. Contador de comentarios
   */
  it('muestra la lista de comentarios y maneja la paginación', () => {
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
  /**
   * Test: Manejo de comentarios ocultos
   * Verifica que los comentarios ocultos no se muestren en la lista
   */

  it('maneja correctamente los comentarios ocultos', () => {
    const commentsWithHidden = [
      ...mockComments,
      {
        id: '3',
        text: 'Comentario oculto',
        author: { id: '3', name: 'User3', avatar: '', initials: 'U3' },
        createdAt: new Date().toISOString(),
        reportCount: 5,
        isHidden: true,
        replies: [],
        parentCommentId: null
      }
    ];

    (useComments as jest.Mock).mockReturnValue({
      comments: commentsWithHidden,
      visibleComments: commentsWithHidden,
      showAllComments: true,
      toggleShowAllComments: mockToggleShowAllComments,
      refreshComments: mockRefreshComments,
    });

    render(<CommentsSection />);
    expect(screen.getByText(/comentarios \(3\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Comentario oculto')).not.toBeInTheDocument();
  });

  /**
   * Test: Interacción con la paginación
   * Verifica el funcionamiento del botón "ver más/menos comentarios"
   */
  it('maneja correctamente la paginación de comentarios', () => {
    const manyComments = Array.from({ length: 5 }, (_, i) => ({
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
      comments: manyComments,
      visibleComments: manyComments.slice(0, 3),
      showAllComments: false,
      toggleShowAllComments: mockToggleShowAllComments,
      refreshComments: mockRefreshComments,
    });

    render(<CommentsSection />);
    
    const verMasButton = screen.getByText(/Ver más comentarios/i);
    expect(verMasButton).toBeInTheDocument();
    expect(screen.getByText(/\(2 más\)/i)).toBeInTheDocument();
    
    fireEvent.click(verMasButton);
    expect(mockToggleShowAllComments).toHaveBeenCalled();
  });

  /**
   * Test: Componente de formulario para usuarios autenticados
   * Verifica que el formulario solo se muestra a usuarios autenticados
   */  it('muestra el formulario solo para usuarios autenticados', () => {
    // Usuario no autenticado
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    const { rerender } = render(<CommentsSection />);
    expect(screen.queryByLabelText(/Añadir comentario/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Inicia sesión para unirte a la conversación/i)).toBeInTheDocument();

    // Usuario autenticado
    (useAuth as jest.Mock).mockReturnValue({ 
      isAuthenticated: true,
      user: { id: '1', userName: 'TestUser' }
    });
    rerender(<CommentsSection />);
    expect(screen.queryByText(/Inicia sesión para unirte/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Añadir comentario/i)).toBeInTheDocument();
  });
});
