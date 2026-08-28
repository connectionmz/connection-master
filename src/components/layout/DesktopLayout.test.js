import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import DesktopLayout from './DesktopLayout';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { createAppTheme } from '../../theme/appTheme';

jest.mock('../desktop/HeaderDesk', () => () => <header>Header empresarial</header>);
jest.mock('../desktop/HeaderDeskPublic', () => () => <header>Header público</header>);
jest.mock('../desktop/HeaderDeskSingular', () => () => <header>Header singular</header>);
jest.mock('../desktop/FooterDesk', () => () => <footer>Footer</footer>);
jest.mock('../../context/ThemeContext', () => ({ useTheme: jest.fn() }));
jest.mock('../../context/LanguageContext', () => ({ useLanguage: jest.fn() }));

const toggleTheme = jest.fn();
const changeLanguage = jest.fn();

const renderLayout = ({ path = '/', authUser = null, profile = null, profileLoading = false } = {}) => render(
  <MuiThemeProvider theme={createAppTheme('light')}>
    <MemoryRouter initialEntries={[path]}>
      <DesktopLayout
        authUser={authUser}
        profile={profile}
        profileLoading={profileLoading}
      >
        <div>Conteúdo</div>
      </DesktopLayout>
    </MemoryRouter>
  </MuiThemeProvider>
);

describe('DesktopLayout', () => {
  beforeEach(() => {
    toggleTheme.mockClear();
    changeLanguage.mockClear();
    useTheme.mockReturnValue({ theme: 'light', toggleTheme });
    useLanguage.mockReturnValue({
      language: 'pt',
      changeLanguage,
      t: (key) => ({
        'layout.skipToContent': 'Saltar para o conteúdo principal',
        'layout.loadingProfile': 'A carregar perfil...',
        'preferences.darkMode': 'Ativar modo escuro',
        'preferences.changeToEnglish': 'Mudar idioma para inglês',
      }[key] || key),
    });
    window.scrollTo = jest.fn();
  });

  it('renderiza landmarks, skip link, header público e footer', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Saltar para o conteúdo principal' }))
      .toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Header público')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('remove header e footer em rotas fullscreen', () => {
    renderLayout({ path: '/auth' });

    expect(screen.queryByText('Header público')).not.toBeInTheDocument();
    expect(screen.queryByText('Footer')).not.toBeInTheDocument();
  });

  it('não mostra header público enquanto o perfil autenticado carrega', () => {
    renderLayout({ authUser: { uid: 'a' }, profileLoading: true });

    expect(screen.queryByText('Header público')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'A carregar perfil...' })).toBeInTheDocument();
  });

  it('seleciona o header singular e permite mudar preferências', () => {
    renderLayout({
      authUser: { uid: 'a' },
      profile: { id: 'a', type: 'singular' },
    });

    expect(screen.getByText('Header singular')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ativar modo escuro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mudar idioma para inglês' }));
    expect(toggleTheme).toHaveBeenCalledTimes(1);
    expect(changeLanguage).toHaveBeenCalledWith('en');
  });
});
