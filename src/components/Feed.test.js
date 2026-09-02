import { act, fireEvent, render, screen } from '@testing-library/react';
import { onValue } from 'firebase/database';
import Feed from './Feed';

const mockNavigate = jest.fn();
const mockTranslate = (key) => key;
let mockEmitPosts;

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(() => 'posts-ref'),
  onValue: jest.fn(),
}));

jest.mock('../fb', () => ({ db: {} }));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt', t: mockTranslate }),
}));

describe('Feed', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    onValue.mockImplementation((reference, onSuccess) => {
      mockEmitPosts = onSuccess;
      return jest.fn();
    });
  });

  it('normaliza, ordena e abre publicações mesmo com dados incompletos', () => {
    render(<Feed user={{ id: 'viewer' }} />);

    act(() => mockEmitPosts({ val: () => ({
      older: { description: '<b>Projeto antigo</b>', timestamp: 100, company: { id: 'a', name: 'Empresa A' } },
      newer: { description: 'Projeto recente', timestamp: 200 },
    }) }));

    const cards = screen.getAllByRole('button', { name: /feed.openPost/i });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAccessibleName('feed.openPost Empresa');
    expect(screen.getByText('Projeto antigo')).toBeInTheDocument();

    fireEvent.click(cards[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/post/newer');
  });

  it('filtra publicações pela empresa selecionada', () => {
    render(<Feed />);
    act(() => mockEmitPosts({ val: () => ({
      first: { description: 'Primeiro', company: { id: 'a', name: 'Empresa A' } },
      second: { description: 'Segundo', company: { id: 'b', name: 'Empresa B' } },
    }) }));

    fireEvent.click(screen.getByRole('button', { name: 'feed.companyFilter: Empresa A' }));
    expect(screen.getByText('Primeiro')).toBeInTheDocument();
    expect(screen.queryByText('Segundo')).not.toBeInTheDocument();
  });
});
