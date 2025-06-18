import { render, screen } from '@testing-library/react';
import CommentForm from '../components/molecules/comment-form';
import { useAuth } from '../context/auth-context';
import { useComments } from '../context/comments-context';

jest.mock('../context/auth-context');
jest.mock('../context/comments-context');

describe('CommentForm', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { userName: 'TestUser' } });
    (useComments as jest.Mock).mockReturnValue({ addComment: jest.fn().mockResolvedValue(undefined) });
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
});
