import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PagamentoModulo from './PagamentoModulo';
import { onValue } from 'firebase/database';
import { useLanguage } from '../context/LanguageContext';

jest.mock('../fb', () => ({ auth: { currentUser: null }, db: {} }));
jest.mock('firebase/database', () => ({
  ref: jest.fn(() => 'modules-ref'),
  onValue: jest.fn(),
}));
jest.mock('../context/LanguageContext', () => ({ useLanguage: jest.fn() }));
jest.mock('./BackButton', () => () => <button type="button">Back</button>);
jest.mock('../according/PagamentoAccordion', () => () => <div>Module details</div>);

const translations = {
  'payment.notFoundTitle': 'Module not found',
  'payment.notFoundDescription': 'Module missing',
  'payment.backHome': 'Back to home page',
  'payment.validity': 'Validity',
  'payment.oneYear': '1 year',
  'payment.oneMonth': '1 month',
  'payment.price': 'Price',
  'payment.moduleValue': 'Module price',
  'payment.reference': 'Reference',
  'payment.phone': 'M-Pesa phone number',
  'payment.phoneHelp': 'Enter nine digits',
  'payment.submit': 'Pay with M-Pesa',
};

const renderPayment = (moduleKey = 'moduloMarket') => render(
  <MemoryRouter initialEntries={[`/pagar/${moduleKey}`]}>
    <Routes>
      <Route path="/pagar/:moduleKey" element={<PagamentoModulo />} />
    </Routes>
  </MemoryRouter>,
);

describe('PagamentoModulo', () => {
  beforeEach(() => {
    useLanguage.mockReturnValue({
      language: 'en',
      t: (key) => translations[key] || key,
    });
  });

  it('shows a translated, accessible payment form for the requested module', async () => {
    onValue.mockImplementation((reference, success) => {
      success({
        val: () => ({
          moduloMarket: { name: 'Market', description: 'Market access', price: 500, validade: 'Mensal' },
        }),
      });
      return jest.fn();
    });

    renderPayment();

    expect(await screen.findByRole('heading', { name: 'Market' })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')[2]).toHaveAttribute('inputmode', 'numeric');
    expect(screen.getByRole('button', { name: 'Pay with M-Pesa' })).toBeDisabled();
  });

  it('shows the translated not-found state for an invalid module key', async () => {
    onValue.mockImplementation((reference, success) => {
      success({ val: () => ({}) });
      return jest.fn();
    });

    renderPayment('missing');

    expect(await screen.findByRole('heading', { name: 'Module not found' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to home page' })).toBeInTheDocument();
  });
});
