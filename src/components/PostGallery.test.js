import { fireEvent, render, screen } from '@testing-library/react';
import PostGallery, { normalizePosts } from './PostGallery';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key, values = {}) => values.company ? `${key}:${values.company}` : key,
  }),
}));

describe('PostGallery', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('normaliza, remove HTML e ordena as publicações mais recentes primeiro', () => {
    expect(normalizePosts([
      { id: 'old', timestamp: 1, description: '<b>Antiga</b>', url: ' old.jpg ' },
      null,
      { id: 'new', timestamp: 2, description: 'Nova', url: 'new.jpg' },
    ])).toEqual([
      expect.objectContaining({ id: 'new' }),
      expect.objectContaining({ id: 'old', description: 'Antiga', url: 'old.jpg' }),
    ]);
  });

  it('abre o detalhe real e não injeta HTML na legenda', () => {
    render(<PostGallery posts={[{
      id: 'post-1',
      timestamp: 1,
      description: '<strong>Projeto seguro</strong>',
      url: 'https://example.test/image.jpg',
      company: { name: 'Empresa A' },
    }]} />);

    expect(screen.getByText('Projeto seguro')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'gallery.openPost:Empresa A' }));
    expect(mockNavigate).toHaveBeenCalledWith('/post/post-1');
  });

  it('apresenta um estado vazio acessível para dados inválidos', () => {
    render(<PostGallery posts={[null, { description: 'Sem identificador' }]} />);
    expect(screen.getByText('gallery.empty')).toBeInTheDocument();
  });
});
