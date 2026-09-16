import { isQuoteVisibleTo, isStorePublic, quoteState } from './commerceVisibility';

test('oculta lojas desativadas e arquivadas', () => {
  expect(isStorePublic({ isActive: false })).toBe(false);
  expect(isStorePublic({ archived: true })).toBe(false);
  expect(isStorePublic({ isActive: true })).toBe(true);
});

test('mantém cotação pendente visível ao proprietário, mas não ao público', () => {
  const quote = { moderationStatus: 'pending', company: { id: 'owner' } };
  expect(isQuoteVisibleTo(quote, 'owner')).toBe(true);
  expect(isQuoteVisibleTo(quote, 'other')).toBe(false);
  expect(quoteState({ status: 'Fechada', verified: true }).lifecycle).toBe('closed');
});
