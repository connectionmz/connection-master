import { get, ref } from 'firebase/database';
import { loadPublicCompanyDirectory } from './companyDirectory';

jest.mock('firebase/database', () => ({ get: jest.fn(), ref: jest.fn((_, path) => path) }));

it('prefere publicCompanies sem consultar perfis completos', async () => {
  get.mockResolvedValueOnce({ exists: () => true, val: () => ({ a: { nome: 'Empresa pública' } }) });
  const result = await loadPublicCompanyDirectory({});
  expect(ref).toHaveBeenCalledWith(expect.anything(), 'publicCompanies');
  expect(get).toHaveBeenCalledTimes(1);
  expect(result[0].nome).toBe('Empresa pública');
});

it('mantém fallback temporário para company', async () => {
  get.mockResolvedValueOnce({ exists: () => false }).mockResolvedValueOnce({ val: () => ({ a: { type: 'empresa', nome: 'Legada' } }) });
  const result = await loadPublicCompanyDirectory({});
  expect(ref).toHaveBeenLastCalledWith(expect.anything(), 'company');
  expect(result[0].nome).toBe('Legada');
});
