export const buildDashboardSearchPath = (query = '') => {
  const value = String(query).trim();
  return value ? `/search?q=${encodeURIComponent(value)}` : '/explorar';
};

export const normalizeProvincePreference = (value) => value === 'national' ? 'Nacional' : String(value || '').trim();
