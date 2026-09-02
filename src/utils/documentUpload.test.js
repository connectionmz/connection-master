import { classifyDocuments, plainDocumentText, safeDocumentName } from './documentUpload';

describe('documentUpload', () => {
  it('remove HTML e limita descrições', () => {
    expect(plainDocumentText('<b> Relatório </b> fiscal')).toBe('Relatório fiscal');
    expect(plainDocumentText('a'.repeat(2100))).toHaveLength(2000);
  });

  it('gera nomes seguros para o Storage', () => {
    expect(safeDocumentName('../../Relatório fiscal 2026.pdf')).toBe('.._.._Relato_rio_fiscal_2026.pdf');
  });

  it('separa duplicados, formatos e tamanhos inválidos', () => {
    const result = classifyDocuments([{ name: 'existente.pdf' }], [
      { name: 'existente.pdf', type: 'application/pdf', size: 10 },
      { name: 'script.exe', type: 'application/x-msdownload', size: 10 },
      { name: 'grande.pdf', type: 'application/pdf', size: 101 },
      { name: 'valido.pdf', type: 'application/pdf', size: 10 },
    ], { maxFiles: 10, maxBytes: 100 });
    expect(result.accepted.map(({ name }) => name)).toEqual(['valido.pdf']);
    expect(result.rejected.map(({ reason }) => reason)).toEqual(['duplicate', 'type', 'size']);
  });

  it('respeita o limite total de ficheiros', () => {
    const result = classifyDocuments([], [
      { name: 'a.pdf', type: 'application/pdf', size: 1 },
      { name: 'b.pdf', type: 'application/pdf', size: 1 },
    ], { maxFiles: 1, maxBytes: 100 });
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected[0].reason).toBe('limit');
  });
});
