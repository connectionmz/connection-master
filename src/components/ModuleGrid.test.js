import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ModuleGrid from './ModuleGrid';
import { useActiveModules } from '../context/ActiveModulesContext';
import { useLanguage } from '../context/LanguageContext';

jest.mock('../context/ActiveModulesContext', () => ({
  useActiveModules: jest.fn(),
}));
jest.mock('../context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

const CurrentPath = () => {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
};

const renderGrid = () => render(
  <MemoryRouter initialEntries={['/app']}>
    <ModuleGrid />
    <CurrentPath />
  </MemoryRouter>
);

describe('ModuleGrid navigation', () => {
  beforeEach(() => {
    useLanguage.mockReturnValue({
      t: (key, values = {}) => ({
        'modules.market.name': 'Produtos e serviços',
        'modules.market.description': 'Cadastre os seus produtos e serviços',
        'modules.alert.name': 'Alertas',
        'modules.alert.description': 'Receba solicitações e pedidos de cotação',
        'modules.active': 'Ativo',
        'modules.locked': 'Bloqueado',
        'modules.available': 'Disponível',
        'modules.unavailable': 'Indisponível — subscreva para aceder',
      }[key] || values.name || key),
    });
  });

  it('leva um módulo inativo para a página de pagamento correta', () => {
    useActiveModules.mockReturnValue({
      isLoading: false,
      isModuleActive: () => false,
    });

    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: 'Produtos e serviços' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/pagar/moduloMarket');
  });

  it('leva o módulo SMS ativo para as cotações', () => {
    useActiveModules.mockReturnValue({
      isLoading: false,
      isModuleActive: (moduleKey) => moduleKey === 'moduloSMS',
    });

    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: 'Alertas' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/cotacoes');
  });
});
