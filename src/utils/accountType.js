const PERSONAL_ACCOUNT_TYPES = new Set(['singular', 'personal']);
const BUSINESS_ACCOUNT_TYPES = new Set(['empresa', 'business', 'company']);

export const getAccountKind = (profile) => {
  const type = String(profile?.type || '').trim().toLowerCase();
  if (PERSONAL_ACCOUNT_TYPES.has(type)) return 'personal';
  if (BUSINESS_ACCOUNT_TYPES.has(type)) return 'business';
  return null;
};

export const isPersonalAccount = (profile) => getAccountKind(profile) === 'personal';
export const isBusinessAccount = (profile) => getAccountKind(profile) === 'business';
