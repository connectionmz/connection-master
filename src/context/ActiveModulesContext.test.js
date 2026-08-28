import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { onValue, ref } from 'firebase/database';
import {
  ActiveModulesProvider,
  filterActiveModules,
  useActiveModules,
} from './ActiveModulesContext';

jest.mock('../fb', () => ({ db: {} }));
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  ref: jest.fn((database, path) => ({ database, path })),
}));

const NOW = Date.parse('2026-08-27T12:00:00.000Z');

describe('filterActiveModules', () => {
  it('aceita módulos vitalícios e expirações futuras numéricas ou ISO', () => {
    const modules = filterActiveModules({
      lifetime: { status: 'active' },
      numeric: { status: 'active', expiresAt: NOW + 1000 },
      numericString: { status: 'active', expiresAt: String(NOW + 1000) },
      iso: { status: 'active', expiresAt: '2026-08-28T12:00:00.000Z' },
    }, NOW);

    expect(Object.keys(modules)).toEqual([
      'lifetime',
      'numeric',
      'numericString',
      'iso',
    ]);
  });

  it('rejeita módulos expirados, datas inválidas e status não ativos', () => {
    const modules = filterActiveModules({
      expired: { status: 'active', expiresAt: NOW },
      invalidDate: { status: 'active', expiresAt: 'not-a-date' },
      inactive: { status: 'inactive', expiresAt: NOW + 1000 },
      legacyWithoutStatus: { limit: 25 },
    }, NOW);

    expect(modules).toEqual({});
  });
});

const ContextProbe = () => {
  const { activeModules, isLoading } = useActiveModules();

  return (
    <div>
      <span data-testid="modules">{Object.keys(activeModules).join(',')}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
};

describe('ActiveModulesProvider', () => {
  const subscriptions = new Map();

  beforeEach(() => {
    subscriptions.clear();
    ref.mockImplementation((database, path) => ({ database, path }));
    onValue.mockImplementation((modulesRef, onSuccess, onError) => {
      subscriptions.set(modulesRef.path, { onSuccess, onError });
      return jest.fn();
    });
  });

  it('não reutiliza módulos da conta anterior durante uma troca de utilizador', () => {
    const { rerender } = render(
      <ActiveModulesProvider userId="company-a">
        <ContextProbe />
      </ActiveModulesProvider>
    );

    act(() => {
      subscriptions.get('company/company-a/activeModules').onSuccess({
        exists: () => true,
        val: () => ({ moduloMarket: { status: 'active' } }),
      });
    });

    expect(screen.getByTestId('modules')).toHaveTextContent('moduloMarket');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');

    rerender(
      <ActiveModulesProvider userId="company-b">
        <ContextProbe />
      </ActiveModulesProvider>
    );

    expect(screen.getByTestId('modules')).toBeEmptyDOMElement();
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'company/company-b/activeModules');
  });
});
