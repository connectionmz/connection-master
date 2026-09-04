import { normalizeCompanyPosts, normalizePostDetail } from './postData';

describe('normalizePostDetail', () => {
  it('usa o timestamp real e converte descrições antigas em texto simples', () => {
    expect(normalizePostDetail({
      timestamp: 123456,
      description: '<p>Projeto <strong>concluído</strong></p>',
      url: ' image.jpg ',
      company: { id: 'company-1', name: 'Empresa A' },
    }, 'post-1', 'Empresa desconhecida')).toEqual(expect.objectContaining({
      id: 'post-1',
      createdAt: 123456,
      description: 'Projeto concluído',
      url: 'image.jpg',
    }));
  });

  it('preserva createdAt quando disponível e tolera dados incompletos', () => {
    expect(normalizePostDetail({ createdAt: '2026-01-01T00:00:00.000Z' }, 'post-2', 'Desconhecida'))
      .toEqual(expect.objectContaining({
        createdAt: '2026-01-01T00:00:00.000Z',
        companyName: 'Desconhecida',
        companyId: '',
      }));
  });
});

describe('normalizeCompanyPosts', () => {
  it('mantém apenas a empresa solicitada, recupera ids e ordena por data', () => {
    expect(normalizeCompanyPosts({
      old: { timestamp: 1, status: 'aprovado', company: { id: 'company-1' } },
      ignored: { timestamp: 3, status: 'aprovado', company: { id: 'company-2' } },
      blocked: { timestamp: 4, status: 'bloqueado', company: { id: 'company-1' } },
      new: { timestamp: 2, status: 'aprovado', company: { id: 'company-1' } },
    }, 'company-1').map(post => post.id)).toEqual(['new', 'old']);
  });
});
