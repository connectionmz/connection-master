import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { onValue, ref } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeAuthPersistence } from '../fb';
import { UserProvider, useUser } from './UserContext';

jest.mock('../fb', () => ({
  auth: {},
  db: {},
  initializeAuthPersistence: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  ref: jest.fn(),
}));

const SessionProbe = () => {
  const session = useUser();

  return (
    <div>
      <span data-testid="auth-user">{session.authUser?.uid || ''}</span>
      <span data-testid="profile">{session.profile?.id || ''}</span>
      <span data-testid="profile-email">{session.profile?.email || ''}</span>
      <span data-testid="session-loading">{String(session.isSessionLoading)}</span>
      <span data-testid="profile-loading">{String(session.isProfileLoading)}</span>
      <span data-testid="error">{session.error?.message || ''}</span>
      <button type="button" onClick={session.signOut}>Sair</button>
    </div>
  );
};

describe('UserProvider', () => {
  let authHandlers;
  let profileSubscriptions;
  let unsubscribeAuth;

  beforeEach(() => {
    authHandlers = {};
    profileSubscriptions = new Map();
    unsubscribeAuth = jest.fn();

    initializeAuthPersistence.mockResolvedValue(true);
    ref.mockImplementation((database, path) => ({ database, path }));
    onAuthStateChanged.mockImplementation((auth, onSuccess, onError) => {
      authHandlers = { onSuccess, onError };
      return unsubscribeAuth;
    });
    onValue.mockImplementation((profileRef, onSuccess, onError) => {
      const unsubscribe = jest.fn();
      profileSubscriptions.set(profileRef.path, { onSuccess, onError, unsubscribe });
      return unsubscribe;
    });
    signOut.mockResolvedValue(undefined);
  });

  const renderProvider = async () => {
    const view = render(
      <UserProvider>
        <SessionProbe />
      </UserProvider>
    );

    await waitFor(() => expect(onAuthStateChanged).toHaveBeenCalledTimes(1));
    return view;
  };

  it('representa corretamente uma sessão anónima', async () => {
    await renderProvider();

    act(() => authHandlers.onSuccess(null));

    expect(screen.getByTestId('auth-user')).toBeEmptyDOMElement();
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    expect(screen.getByTestId('session-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('profile-loading')).toHaveTextContent('false');
  });

  it('compõe o perfil com UID e email da identidade autenticada', async () => {
    await renderProvider();

    act(() => authHandlers.onSuccess({ uid: 'company-a', email: 'a@example.com' }));
    act(() => {
      profileSubscriptions.get('company/company-a').onSuccess({
        val: () => ({ nome: 'Empresa A' }),
      });
    });

    expect(screen.getByTestId('auth-user')).toHaveTextContent('company-a');
    expect(screen.getByTestId('profile')).toHaveTextContent('company-a');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('a@example.com');
    expect(screen.getByTestId('profile-loading')).toHaveTextContent('false');
  });

  it('mantém a identidade e termina o loading quando não existe perfil', async () => {
    await renderProvider();

    act(() => authHandlers.onSuccess({ uid: 'new-user', email: 'new@example.com' }));
    act(() => {
      profileSubscriptions.get('company/new-user').onSuccess({ val: () => null });
    });

    expect(screen.getByTestId('auth-user')).toHaveTextContent('new-user');
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    expect(screen.getByTestId('profile-loading')).toHaveTextContent('false');
  });

  it('limpa o perfil anterior e ignora callbacks obsoletos ao trocar de conta', async () => {
    await renderProvider();

    act(() => authHandlers.onSuccess({ uid: 'company-a', email: 'a@example.com' }));
    const companyASubscription = profileSubscriptions.get('company/company-a');
    act(() => {
      companyASubscription.onSuccess({ val: () => ({ nome: 'Empresa A' }) });
    });

    act(() => authHandlers.onSuccess({ uid: 'company-b', email: 'b@example.com' }));

    expect(companyASubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('auth-user')).toHaveTextContent('company-b');
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    expect(screen.getByTestId('profile-loading')).toHaveTextContent('true');

    act(() => {
      companyASubscription.onSuccess({ val: () => ({ nome: 'Perfil obsoleto' }) });
    });
    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
  });

  it('expõe erros de perfil sem manter dados anteriores', async () => {
    await renderProvider();

    act(() => authHandlers.onSuccess({ uid: 'company-a', email: 'a@example.com' }));
    act(() => {
      profileSubscriptions.get('company/company-a').onError(new Error('permission-denied'));
    });

    expect(screen.getByTestId('profile')).toBeEmptyDOMElement();
    expect(screen.getByTestId('profile-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('permission-denied');
  });

  it('expõe logout e limpa os listeners ao desmontar', async () => {
    const { unmount } = await renderProvider();

    act(() => authHandlers.onSuccess({ uid: 'company-a', email: 'a@example.com' }));
    const profileSubscription = profileSubscriptions.get('company/company-a');

    await act(async () => screen.getByRole('button', { name: 'Sair' }).click());
    expect(signOut).toHaveBeenCalledTimes(1);

    unmount();
    expect(profileSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribeAuth).toHaveBeenCalledTimes(1);
  });
});
