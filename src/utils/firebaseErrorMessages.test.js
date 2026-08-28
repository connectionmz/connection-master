import { getFirebaseErrorMessage } from './firebaseErrorMessages';

describe('getFirebaseErrorMessage', () => {
  it('traduz um código conhecido do Firebase Auth', () => {
    expect(getFirebaseErrorMessage('auth/invalid-credential')).toBe(
      'Email ou senha incorretos.'
    );
  });

  it('devolve uma mensagem segura para códigos desconhecidos', () => {
    expect(getFirebaseErrorMessage('auth/unknown-error')).toBe(
      'Ocorreu um erro. Tente novamente.'
    );
  });

  it('aceita um código ausente sem lançar uma exceção', () => {
    expect(getFirebaseErrorMessage()).toBe(
      'Ocorreu um erro. Tente novamente.'
    );
  });
});
