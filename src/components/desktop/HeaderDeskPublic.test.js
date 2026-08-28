import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import HeaderDeskPublic from './HeaderDeskPublic';
import { LanguageProvider } from '../../context/LanguageContext';
import { createAppTheme } from '../../theme/appTheme';

const renderHeader = () => render(
  <ThemeProvider theme={createAppTheme('dark')}>
    <LanguageProvider>
      <MemoryRouter initialEntries={['/explorar']}>
        <HeaderDeskPublic />
      </MemoryRouter>
    </LanguageProvider>
  </ThemeProvider>,
);

describe('HeaderDeskPublic', () => {
  beforeEach(() => {
    localStorage.setItem('connection-language', 'en');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('uses current routes and translates visible navigation', () => {
    renderHeader();

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Suppliers/i })).toHaveAttribute('href', '/explorar');
    expect(screen.getByRole('link', { name: /Stores/i })).toHaveAttribute('href', '/lojas');
    expect(screen.getByRole('link', { name: /Sign in/i })).toHaveAttribute('href', '/auth');
  });
});
