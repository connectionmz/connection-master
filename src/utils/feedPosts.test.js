import { filterFeedPosts, isSearchActive, normalizeFeedPost, normalizePublicFeedPosts, uniqueCompanies } from './feedPosts';

const post = (id, description, company = {}, timestamp = 1) => normalizeFeedPost(id, {
  description,
  timestamp,
  url: `https://img/${id}.jpg`,
  status: 'aprovado',
  company: { id: `c-${id}`, name: `Empresa ${id}`, provincia: 'Cabo Delgado', sector: 'Construção', ...company },
});

describe('normalizeFeedPost', () => {
  it('converte HTML e entidades da descrição em texto e normaliza a empresa', () => {
    expect(normalizeFeedPost('p1', {
      description: '<p>Armazém&nbsp;para <strong>aluguer</strong></p>',
      timestamp: '1700000000000',
      url: 'https://img/1.jpg',
      company: { id: 'c1', name: 'Africa Corporation', provincia: 'Cabo Delgado', sector: 'Imobiliária' },
    })).toEqual({
      id: 'p1',
      description: 'Armazém para aluguer',
      imageUrl: 'https://img/1.jpg',
      timestamp: 1700000000000,
      company: { id: 'c1', name: 'Africa Corporation', logo: '', province: 'Cabo Delgado', sector: 'Imobiliária' },
    });
  });

  it('tolera dados incompletos', () => {
    expect(normalizeFeedPost('p2', null)).toEqual(expect.objectContaining({
      id: 'p2', description: '', imageUrl: '', timestamp: 0, company: expect.objectContaining({ name: 'Empresa' }),
    }));
  });
});

describe('normalizePublicFeedPosts', () => {
  it('mantém só as aprovadas, da mais recente para a mais antiga', () => {
    const result = normalizePublicFeedPosts({
      old: { status: 'aprovado', timestamp: 1 },
      blocked: { status: 'bloqueado', timestamp: 5 },
      pending: { timestamp: 4 },
      recent: { status: 'aprovado', timestamp: 3 },
    });
    expect(result.map(({ id }) => id)).toEqual(['recent', 'old']);
  });

  it('devolve lista vazia sem dados', () => {
    expect(normalizePublicFeedPosts(null)).toEqual([]);
  });
});

describe('filterFeedPosts', () => {
  const posts = [
    post('1', 'Armazém para aluguer na cidade', { name: 'Africa Corporation' }),
    post('2', 'Vendemos pneus e acessórios', { name: 'Auto Pemba', sector: 'Transportes', provincia: 'Nampula' }),
    post('3', 'Serviços de construção civil', { name: 'Construções VIP' }),
  ];

  it('ignora acentos e maiúsculas', () => {
    expect(filterFeedPosts(posts, { search: 'ARMAZEM' }).map(({ id }) => id)).toEqual(['1']);
    expect(filterFeedPosts(posts, { search: 'construcao' }).map(({ id }) => id)).toEqual(['1', '3']);
  });

  it('exige todas as palavras e pesquisa também empresa, setor e província', () => {
    expect(filterFeedPosts(posts, { search: 'pneus nampula' }).map(({ id }) => id)).toEqual(['2']);
    expect(filterFeedPosts(posts, { search: 'pneus armazem' })).toEqual([]);
    expect(filterFeedPosts(posts, { search: 'auto transportes' }).map(({ id }) => id)).toEqual(['2']);
  });

  it('filtra por empresa e combina com a pesquisa', () => {
    expect(filterFeedPosts(posts, { companyId: 'c-3' }).map(({ id }) => id)).toEqual(['3']);
    expect(filterFeedPosts(posts, { companyId: 'c-3', search: 'pneus' })).toEqual([]);
  });

  it('sem pesquisa nem empresa devolve tudo', () => {
    expect(filterFeedPosts(posts)).toHaveLength(3);
  });
});

describe('uniqueCompanies / isSearchActive', () => {
  it('lista cada empresa uma só vez', () => {
    const posts = [post('1', 'a', { id: 'x', name: 'X' }), post('2', 'b', { id: 'x', name: 'X' }), post('3', 'c', { id: 'y', name: 'Y' })];
    expect(uniqueCompanies(posts).map(({ key }) => key)).toEqual(['x', 'y']);
  });

  it('só pesquisa a partir de 2 caracteres úteis', () => {
    expect(isSearchActive('')).toBe(false);
    expect(isSearchActive(' a ')).toBe(false);
    expect(isSearchActive('ar')).toBe(true);
  });
});
