import { render, screen } from '@testing-library/react';
import App from './App';
import { useUser } from './context/UserContext';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';

jest.mock('./context/UserContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('./context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('./context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('./components/routes/DesktopRoutes', () => (props) => (
  <div data-testid="desktop-routes">
    {props.authUser?.uid}:{props.user?.id}:{String(props.profileLoading)}
  </div>
));

describe('App session integration', () => {
  beforeEach(() => {
    useTheme.mockReturnValue({ theme: 'light' });
    useLanguage.mockReturnValue({
      t: (key) => ({
        'app.loadingSession': 'Verificando autenticação...',
        'app.sessionError': 'Não foi possível carregar a sessão. Tente novamente.',
      }[key] || key),
    });
  });

  it('mostra o estado de inicialização da sessão', () => {
    useUser.mockReturnValue({
      authUser: null,
      profile: null,
      isSessionLoading: true,
      isProfileLoading: false,
      error: null,
      signOut: jest.fn(),
    });

    render(<App />);

    expect(screen.getByText('Verificando autenticação...')).toBeInTheDocument();
  });

  it('entrega identidade e perfil separados ao router', () => {
    useUser.mockReturnValue({
      authUser: { uid: 'company-a' },
      profile: { id: 'company-a' },
      isSessionLoading: false,
      isProfileLoading: false,
      error: null,
      signOut: jest.fn(),
    });

    render(<App />);

    expect(screen.getByTestId('desktop-routes')).toHaveTextContent(
      'company-a:company-a:false'
    );
  });
});
