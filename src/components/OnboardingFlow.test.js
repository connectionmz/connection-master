import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import GuestRoute from './routes/GuestRoute';
import SelectAccountType from './SelectAccountType';
import { useLanguage } from '../context/LanguageContext';

jest.mock('../context/LanguageContext', () => ({ useLanguage: jest.fn() }));

const messages = {
  'onboarding.accountType.title': 'Choose account type',
  'onboarding.accountType.description': 'Choose how to use the platform',
  'onboarding.accountType.created': 'Account created',
  'onboarding.accountType.personal': 'Personal account',
  'onboarding.accountType.personalDescription': 'Personal description',
  'onboarding.accountType.business': 'Business account',
  'onboarding.accountType.businessDescription': 'Business description',
  'onboarding.accountType.select': 'Select',
  'onboarding.accountType.selected': 'Selected',
  'onboarding.accountType.continue': 'Continue',
  'onboarding.accountType.required': 'Select an account type',
};

const CurrentPath = () => {
  const { pathname } = useLocation();
  return <span data-testid="path">{pathname}</span>;
};

describe('onboarding routing', () => {
  beforeEach(() => {
    useLanguage.mockReturnValue({ t: (key) => messages[key] || key });
  });

  it('redirects an authenticated incomplete account to account selection', () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <GuestRoute user={{ uid: 'new-user' }} redirectTo="/select-account-type">
          <div>Registration</div>
        </GuestRoute>
        <CurrentPath />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('path')).toHaveTextContent('/select-account-type');
  });

  it('routes a business selection to company setup', () => {
    render(
      <MemoryRouter initialEntries={['/select-account-type']}>
        <Routes>
          <Route path="/select-account-type" element={<SelectAccountType />} />
          <Route path="/setup" element={<div>Company setup</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Business account/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByText('Company setup')).toBeInTheDocument();
  });
});
