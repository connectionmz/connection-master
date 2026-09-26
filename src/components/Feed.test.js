import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Feed from './Feed';
import { loadAllPublicPosts, loadPublicPostsPage } from '../services/feedPosts';
import { normalizeFeedPost } from '../utils/feedPosts';

const mockNavigate = jest.fn();
const mockTranslate = (key) => key;

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/feedPosts', () => ({
  loadPublicPostsPage: jest.fn(),
  loadAllPublicPosts: jest.fn(),
}));

jest.mock('../fb', () => ({ db: {} }));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt', t: mockTranslate }),
}));

const post = (id, description, company = { id: 'a', name: 'Empresa A' }, timestamp = 1000) => normalizeFeedPost(id, {
  description, timestamp, status: 'aprovado', company: { provincia: 'Cabo Delgado', ...company },
});

const manyPosts = (count, startAt = 0) => Array.from({ length: count }, (_, index) => post(`p${startAt + index}`, `Publicação ${startAt + index}`, undefined, 5000 - startAt - index));

describe('Feed', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    loadPublicPostsPage.mockReset();
    loadAllPublicPosts.mockReset();
  });

  it('mostra a primeira fatia, abre a publicação e não descarrega tudo', async () => {
    loadPublicPostsPage.mockResolvedValue({
      posts: [post('newer', 'Projeto recente', undefined, 200), post('older', 'Projeto antigo', { id: 'b', name: 'Empresa B' }, 100)],
      cursor: null,
      hasMore: false,
    });
    render(<Feed user={{ id: 'viewer' }} />);

    const cards = await screen.findAllByRole('button', { name: /feed.openPost/i });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAccessibleName('feed.openPost Empresa A');
    expect(screen.getByText('Projeto antigo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'feed.loadMore' })).not.toBeInTheDocument();
    expect(loadAllPublicPosts).not.toHaveBeenCalled();
    expect(loadPublicPostsPage).toHaveBeenCalledWith({}, { minPublic: 12 });

    fireEvent.click(cards[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/post/newer');
  });

  it('mostra 12 de cada vez e vai buscar a fatia seguinte ao servidor só quando faz falta', async () => {
    loadPublicPostsPage
      .mockResolvedValueOnce({ posts: manyPosts(12), cursor: { id: 'p11', timestamp: 4989 }, hasMore: true })
      .mockResolvedValueOnce({ posts: manyPosts(5, 12), cursor: { id: 'p16', timestamp: 4984 }, hasMore: false });
    render(<Feed />);

    expect(await screen.findAllByRole('button', { name: /feed.openPost/i })).toHaveLength(12);
    fireEvent.click(screen.getByRole('button', { name: 'feed.loadMore' }));

    await waitFor(() => expect(screen.getAllByRole('button', { name: /feed.openPost/i })).toHaveLength(17));
    expect(loadPublicPostsPage).toHaveBeenLastCalledWith({}, { minPublic: 12, before: { id: 'p11', timestamp: 4989 } });
    expect(screen.queryByRole('button', { name: 'feed.loadMore' })).not.toBeInTheDocument();
  });

  it('só revela mais cartões quando há dados já carregados (sem novo pedido)', async () => {
    loadPublicPostsPage.mockResolvedValue({ posts: manyPosts(15), cursor: { id: 'p14', timestamp: 4986 }, hasMore: false });
    render(<Feed />);

    expect(await screen.findAllByRole('button', { name: /feed.openPost/i })).toHaveLength(12);
    fireEvent.click(screen.getByRole('button', { name: 'feed.loadMore' }));

    await waitFor(() => expect(screen.getAllByRole('button', { name: /feed.openPost/i })).toHaveLength(15));
    expect(loadPublicPostsPage).toHaveBeenCalledTimes(1);
  });

  it('pesquisa em todas as publicações, ignorando acentos, e permite limpar', async () => {
    loadPublicPostsPage.mockResolvedValue({ posts: [post('1', 'Primeiro')], cursor: null, hasMore: false });
    loadAllPublicPosts.mockResolvedValue([
      post('1', 'Primeiro'),
      post('2', 'Armazém para aluguer', { id: 'b', name: 'Empresa B' }),
      post('3', 'Vendemos pneus', { id: 'c', name: 'Empresa C' }),
    ]);
    render(<Feed />);
    await screen.findByText('Primeiro');

    fireEvent.change(screen.getByRole('textbox', { name: 'feed.searchLabel' }), { target: { value: 'armazem' } });

    expect(await screen.findByText('Armazém para aluguer')).toBeInTheDocument();
    expect(screen.queryByText('Vendemos pneus')).not.toBeInTheDocument();
    expect(screen.queryByText('Primeiro')).not.toBeInTheDocument();
    expect(loadAllPublicPosts).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'feed.clearSearch' }));
    expect(await screen.findByText('Primeiro')).toBeInTheDocument();
  });

  it('não pesquisa com menos de 2 letras e mostra estado vazio sem resultados', async () => {
    loadPublicPostsPage.mockResolvedValue({ posts: [post('1', 'Primeiro')], cursor: null, hasMore: false });
    loadAllPublicPosts.mockResolvedValue([post('1', 'Primeiro')]);
    render(<Feed />);
    await screen.findByText('Primeiro');
    const input = screen.getByRole('textbox', { name: 'feed.searchLabel' });

    fireEvent.change(input, { target: { value: 'a' } });
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(loadAllPublicPosts).not.toHaveBeenCalled();
    expect(screen.getByText('Primeiro')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(await screen.findByRole('heading', { name: 'feed.noResults' })).toBeInTheDocument();
  });

  it('filtra publicações pela empresa selecionada', async () => {
    const all = [
      post('first', 'Primeiro', { id: 'a', name: 'Empresa A' }),
      post('second', 'Segundo', { id: 'b', name: 'Empresa B' }),
    ];
    loadPublicPostsPage.mockResolvedValue({ posts: all, cursor: null, hasMore: false });
    loadAllPublicPosts.mockResolvedValue(all);
    render(<Feed />);

    fireEvent.click(await screen.findByRole('button', { name: 'feed.companyFilter: Empresa A' }));

    expect(await screen.findByText('Primeiro')).toBeInTheDocument();
    expect(screen.queryByText('Segundo')).not.toBeInTheDocument();
    expect(loadAllPublicPosts).toHaveBeenCalledTimes(1);
  });

  it('mostra erro com opção de tentar de novo quando o carregamento falha', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    loadPublicPostsPage.mockRejectedValueOnce(new Error('offline'));
    loadPublicPostsPage.mockResolvedValueOnce({ posts: [post('1', 'Primeiro')], cursor: null, hasMore: false });
    render(<Feed />);

    fireEvent.click(await screen.findByRole('button', { name: 'feed.retry' }));

    expect(await screen.findByText('Primeiro')).toBeInTheDocument();
    expect(screen.queryByText('feed.loadError')).not.toBeInTheDocument();
  });
});
