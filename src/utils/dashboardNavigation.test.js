import { buildDashboardSearchPath, normalizeProvincePreference } from './dashboardNavigation';

it('cria uma pesquisa codificada ou abre o diretório', () => {
  expect(buildDashboardSearchPath(' cimento cola ')).toBe('/search?q=cimento%20cola');
  expect(buildDashboardSearchPath(' ')).toBe('/explorar');
});

it('normaliza a preferência nacional e provincial', () => {
  expect(normalizeProvincePreference('national')).toBe('Nacional');
  expect(normalizeProvincePreference(' Maputo ')).toBe('Maputo');
});
