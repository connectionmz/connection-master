import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AccountEditProfileRoute, AccountProfileRoute } from './AccountProfileRoute';

jest.mock('../desktop/ProfileDesk', () => ({ user }) => <div>business-profile:{user.id}</div>);
jest.mock('../desktop/ProfileDeskSingular', () => ({ user }) => <div>personal-profile:{user.id}</div>);
jest.mock('../desktop/EditProfileDesk', () => ({ user }) => <div>business-edit:{user.id}</div>);
jest.mock('../desktop/EditProfileDeskSingular', () => ({ user }) => <div>personal-edit:{user.id}</div>);

const renderRoute = (element) => render(
  <MemoryRouter initialEntries={['/perfil']}>
    <Routes>
      <Route path="/perfil" element={element} />
      <Route path="/select-account-type" element={<div>select-account-type</div>} />
    </Routes>
  </MemoryRouter>,
);

describe('rotas de perfil por tipo de conta', () => {
  it('abre o perfil pessoal para uma conta singular', () => {
    renderRoute(<AccountProfileRoute user={{ id: 'personal-1', type: 'singular' }} />);
    expect(screen.getByText('personal-profile:personal-1')).toBeInTheDocument();
  });

  it('abre o editor empresarial para uma empresa', () => {
    renderRoute(<AccountEditProfileRoute user={{ id: 'business-1', type: 'empresa' }} />);
    expect(screen.getByText('business-edit:business-1')).toBeInTheDocument();
  });

  it('encaminha perfis incompletos para seleção de conta', () => {
    renderRoute(<AccountProfileRoute user={{ id: 'incomplete' }} />);
    expect(screen.getByText('select-account-type')).toBeInTheDocument();
  });
});
