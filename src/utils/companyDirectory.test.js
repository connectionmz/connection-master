import { createCompanyDirectory, filterCompanyDirectory } from './companyDirectory';

it('expõe apenas campos públicos de empresas e exclui contas pessoais', () => {
  const result = createCompanyDirectory({
    a: { type: 'empresa', nome: 'Construções Moçambique', bankDetails: { secret: true }, subsectores: { x: 'Obras' } },
    b: { type: 'personal', nome: 'Pessoa' },
  });
  expect(result).toHaveLength(1);
  expect(result[0]).not.toHaveProperty('bankDetails');
  expect(result[0].subsectores).toEqual(['Obras']);
});

it('pesquisa sem depender de acentos e aceita bio', () => {
  const companies = createCompanyDirectory({ a: { type: 'business', nome: 'Moçambique', bio: 'Construção civil' } });
  expect(filterCompanyDirectory(companies, { search: 'mocambique', sector: '', subsector: '', province: '', district: '', entityType: '' })).toHaveLength(1);
});
