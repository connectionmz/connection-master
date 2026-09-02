import { isBusinessAccount } from './accountType';

export const normalizeDirectoryText = (value = '') => String(value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const toPublicCompany = (id, company = {}) => ({
  id,
  nome: company.nome || '', sigla: company.sigla || '', bio: company.bio || company.descricao || '',
  sector: company.sector || '', subsectores: Array.isArray(company.subsectores) ? company.subsectores : Object.values(company.subsectores || {}).filter(Boolean),
  provincia: company.provincia || '', distrito: company.distrito || '', tipoEntidade: company.tipoEntidade || '',
  logoUrl: company.logoUrl || '', slug: company.slug || '', verified: company.verified || false,
});

export const createCompanyDirectory = (data = {}) => Object.entries(data)
  .filter(([, company]) => isBusinessAccount(company))
  .map(([id, company]) => toPublicCompany(id, company));

export const filterCompanyDirectory = (companies, filters) => {
  const query = normalizeDirectoryText(filters.search);
  return companies.filter((company) => {
    const searchable = normalizeDirectoryText([company.nome, company.sigla, company.bio, company.sector].join(' '));
    return (!query || searchable.includes(query))
      && (!filters.sector || company.sector === filters.sector)
      && (!filters.subsector || company.subsectores.includes(filters.subsector))
      && (!filters.province || company.provincia === filters.province)
      && (!filters.district || company.distrito === filters.district)
      && (!filters.entityType || company.tipoEntidade === filters.entityType);
  });
};
