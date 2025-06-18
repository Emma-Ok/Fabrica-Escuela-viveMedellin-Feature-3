import { render, screen, fireEvent } from '@testing-library/react';
import CommentItem from '../components/molecules/comment-item';
import { useAuth } from '../context/auth-context';
import { useComments } from '../context/comments-context';

jest.mock('../context/auth-context');
jest.mock('../context/comments-context');

describe('CommentItem', () => {
  const mockComment = {
    id: '1',
    text: 'Comentario de prueba',
    createdAt: new Date().toISOString(),
    author: { id: '123', name: 'TestUser', avatar: '', initials: 'TU' },
    reportCount: 0,
    isHidden: false,
    replies: [],
    parentCommentId: null,
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '123', userName: 'TestUser' } });
    (useComments as jest.Mock).mockReturnValue({
      editComment: jest.fn(),
      deleteComment: jest.fn(),
      addComment: jest.fn(),
      reportComment: jest.fn(),
      hideComment: jest.fn(),
      unhideComment: jest.fn(),
    });
  });

  it('renderiza el texto del comentario', () => {
    render(<CommentItem comment={mockComment} />);
    expect(screen.getByText('Comentario de prueba')).toBeInTheDocument();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('muestra los botones de autor', () => {
    render(<CommentItem comment={mockComment} />);
    expect(screen.getByLabelText(/Editar comentario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Eliminar comentario/i)).toBeInTheDocument();
  });

  it('permite responder a un comentario', () => {
    render(<CommentItem comment={mockComment} />);
    fireEvent.click(screen.getByLabelText(/Responder comentario/i));
    expect(screen.getByPlaceholderText(/Escribe tu respuesta/i)).toBeInTheDocument();
  });
});
