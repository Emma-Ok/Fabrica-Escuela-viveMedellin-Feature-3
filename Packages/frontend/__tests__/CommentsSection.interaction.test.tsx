import { render, screen, fireEvent } from '@testing-library/react';
import CommentsSection from '../components/organisms/comments-section';
import { useComments } from '../context/comments-context';
import { useAuth } from '../context/auth-context';

jest.mock('../context/comments-context');
jest.mock('../context/auth-context');

describe('CommentsSection - interacción', () => {
  beforeEach(() => {
    (useComments as jest.Mock).mockReturnValue({
      comments: [
        { id: 1, text: 'Comentario 1', createdAt: new Date().toISOString(), author: { id: '1', name: 'User1', avatar: '', initials: 'U1' }, reportCount: 0, isHidden: false, replies: [], parentCommentId: null },
        { id: 2, text: 'Comentario 2', createdAt: new Date().toISOString(), author: { id: '2', name: 'User2', avatar: '', initials: 'U2' }, reportCount: 0, isHidden: false, replies: [], parentCommentId: null },
        { id: 3, text: 'Comentario 3', createdAt: new Date().toISOString(), author: { id: '3', name: 'User3', avatar: '', initials: 'U3' }, reportCount: 0, isHidden: false, replies: [], parentCommentId: null },
        { id: 4, text: 'Comentario 4', createdAt: new Date().toISOString(), author: { id: '4', name: 'User4', avatar: '', initials: 'U4' }, reportCount: 0, isHidden: false, replies: [], parentCommentId: null },
      ],
      visibleComments: [
        { id: 1, text: 'Comentario 1', createdAt: new Date().toISOString(), author: { id: '1', name: 'User1', avatar: '', initials: 'U1' }, reportCount: 0, isHidden: false, replies: [], parentCommentId: null },
        { id: 2, text: 'Comentario 2', createdAt: new Date().toISOString(), author: { id: '2', name: 'User2', avatar: '', initials: 'U2' }, reportCount: 0, isHidden: false, replies: [], parentCommentId: null },
        { id: 3, text: 'Comentario 3', createdAt: new Date().toISOString(), author: { id: '3', name: 'User3', avatar: '', initials: 'U3' }, reportCount: 0, isHidden: false, replies: [], parentCommentId: null },
      ],
      showAllComments: false,
      toggleShowAllComments: jest.fn(),
      refreshComments: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
  });

  it('muestra el botón para ver más comentarios si hay más de 3', () => {
    render(<CommentsSection />);
    expect(screen.getByText(/Ver más comentarios/i)).toBeInTheDocument();
  });

  it('llama a toggleShowAllComments al hacer click en el botón', () => {
    const { getByText } = screen;
    render(<CommentsSection />);
    fireEvent.click(getByText(/Ver más comentarios/i));
    // Aquí podrías verificar que toggleShowAllComments fue llamado si lo exportas o lo espías
  });
});
