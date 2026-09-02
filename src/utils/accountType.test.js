import { getAccountKind, isBusinessAccount, isPersonalAccount } from './accountType';

describe('accountType', () => {
  it.each(['singular', 'personal'])('reconhece %s como conta pessoal', (type) => {
    expect(getAccountKind({ type })).toBe('personal');
    expect(isPersonalAccount({ type })).toBe(true);
  });

  it.each(['empresa', 'business', 'company'])('reconhece %s como conta empresarial', (type) => {
    expect(getAccountKind({ type })).toBe('business');
    expect(isBusinessAccount({ type })).toBe(true);
  });

  it('não presume um tipo quando o perfil está incompleto', () => {
    expect(getAccountKind(null)).toBeNull();
    expect(getAccountKind({})).toBeNull();
  });
});
