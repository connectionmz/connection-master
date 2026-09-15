import { sanitizeBankDetails } from './DadosBancarios';

describe('sanitizeBankDetails', () => {
  it('normaliza os dados bancários antes de os guardar', () => {
    expect(sanitizeBankDetails({
      banco: ' BCI ',
      numeroConta: ' 12 34 ',
      titularConta: '  Empresa A  ',
      nib: ' 000 111 ',
      iban: ' mz59 0001 ',
    })).toEqual({
      banco: 'BCI',
      numeroConta: '1234',
      titularConta: 'Empresa A',
      nib: '000111',
      iban: 'MZ590001',
    });
  });

  it('limita o tamanho dos valores aceites', () => {
    const result = sanitizeBankDetails({
      banco: 'A'.repeat(80),
      numeroConta: '1'.repeat(50),
      titularConta: 'N'.repeat(150),
      nib: '2'.repeat(50),
      iban: 'm'.repeat(50),
    });
    expect(result.banco).toHaveLength(60);
    expect(result.numeroConta).toHaveLength(34);
    expect(result.titularConta).toHaveLength(120);
    expect(result.nib).toHaveLength(34);
    expect(result.iban).toBe('M'.repeat(34));
  });
});
