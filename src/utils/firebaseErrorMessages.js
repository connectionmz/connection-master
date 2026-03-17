// Mantenha apenas uma instância de cada chave
const firebaseErrorMessages = {
  // ... outras mensagens
  'auth/invalid-user-token': 'Sessão inválida. Por favor, faça login novamente.',
  'auth/invalid-credential': 'Email ou senha incorretos.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-email': 'Email inválido.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/email-already-in-use': 'Este email já está em uso.',
  'auth/operation-not-allowed': 'Operação não permitida.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/requires-recent-login': 'Por favor, faça login novamente para continuar.',
  'auth/invalid-verification-code': 'Código de verificação inválido.',
  'auth/invalid-verification-id': 'ID de verificação inválido.',
  'auth/missing-verification-code': 'Código de verificação não fornecido.',
  'auth/missing-verification-id': 'ID de verificação não fornecido.',
  'auth/invalid-phone-number': 'Número de telefone inválido.',
  'auth/missing-phone-number': 'Número de telefone não fornecido.',
  // ... remova todas as duplicatas
};