import { decodeEntities, splitAboutSections, textToEditorHtml, toBlocks, toReadableText } from './richText';

describe('decodeEntities', () => {
  it('converte entidades comuns em caracteres', () => {
    expect(decodeEntities('Missão&nbsp;Oferecer &amp; crescer &#233; &#x41;')).toBe('Missão Oferecer & crescer é A');
  });

  it('mantém entidades desconhecidas intactas', () => {
    expect(decodeEntities('&naoexiste; &#0;')).toBe('&naoexiste; &#0;');
  });
});

describe('toReadableText', () => {
  it('mantém parágrafos, quebras e listas do HTML do editor', () => {
    const html = '<h2>Missão</h2><p>Servir <strong>bem</strong>.</p><p><br></p><p>Segunda linha</p><ul><li>Qualidade</li><li>Rapidez</li></ul><ol><li>Um</li><li>Dois</li></ol>';
    expect(toReadableText(html)).toBe('Missão\nServir bem.\n\nSegunda linha\n\n• Qualidade\n• Rapidez\n\n1. Um\n2. Dois');
  });

  it('remove &nbsp; e espaços repetidos sem perder as quebras de linha', () => {
    expect(toReadableText('Missão &nbsp;Oferecer\n\n\n\ncomo&nbsp;solução')).toBe('Missão Oferecer\n\ncomo solução');
  });

  it('remove espaços antes de pontuação', () => {
    expect(toReadableText('Norte de Moçambique . Serviço , qualidade')).toBe('Norte de Moçambique. Serviço, qualidade');
  });

  it('não interpreta entidades como HTML', () => {
    expect(toReadableText('&lt;b&gt;texto&lt;/b&gt;')).toBe('<b>texto</b>');
  });

  it('tolera valores vazios', () => {
    expect(toReadableText(null)).toBe('');
    expect(toReadableText(undefined)).toBe('');
  });
});

describe('textToEditorHtml', () => {
  it('converte texto com quebras em parágrafos do editor e volta ao mesmo texto', () => {
    const text = 'Missão\nServir bem & crescer.\n\n• Qualidade\n• Rapidez';
    const html = textToEditorHtml(text);
    expect(html).toBe('<p>Missão</p><p>Servir bem &amp; crescer.</p><p><br></p><p>• Qualidade</p><p>• Rapidez</p>');
    expect(toReadableText(html)).toBe(text);
  });

  it('escapa HTML digitado como texto e devolve vazio sem conteúdo', () => {
    expect(textToEditorHtml('<b>x</b>')).toBe('<p>x</p>');
    expect(textToEditorHtml('a &lt; b')).toBe('<p>a &lt; b</p>');
    expect(textToEditorHtml('')).toBe('');
  });
});

describe('splitAboutSections', () => {
  it('separa Visão, Missão e Valores de texto achatado sem pontuação de título', () => {
    const text = 'Visão Ser referência em serviços de reprografia em Pemba. Missão Oferecer impressões com rapidez. Valores Qualidade Rapidez Confiança Inovação Profissionalismo';
    expect(splitAboutSections(text)).toEqual([
      { heading: 'Visão', body: 'Ser referência em serviços de reprografia em Pemba.' },
      { heading: 'Missão', body: 'Oferecer impressões com rapidez.' },
      { heading: 'Valores', body: 'Qualidade Rapidez Confiança Inovação Profissionalismo' },
    ]);
  });

  it('aceita títulos com dois pontos e espaço antes', () => {
    const text = 'Missão : Capacitar os produtores. Visão: Ser parceiro de referência. Valores: Ética e Compromisso.';
    expect(splitAboutSections(text).map(({ heading, body }) => [heading, body])).toEqual([
      ['Missão', 'Capacitar os produtores.'],
      ['Visão', 'Ser parceiro de referência.'],
      ['Valores', 'Ética e Compromisso.'],
    ]);
  });

  it('mantém o texto de introdução antes do primeiro título', () => {
    const [intro, mission] = splitAboutSections('Somos a Empresa X. Missão: Servir. Visão: Crescer.');
    expect(intro).toEqual({ heading: null, body: 'Somos a Empresa X.' });
    expect(mission).toEqual({ heading: 'Missão', body: 'Servir.' });
  });

  it('não parte texto normal que apenas menciona a palavra', () => {
    const text = 'Missão da empresa é servir bem. A nossa visão é crescer.';
    expect(splitAboutSections(text)).toEqual([{ heading: null, body: text }]);
  });

  it('não trata uma menção no meio de uma frase como título', () => {
    const text = 'Trabalhamos com Valores Éticos e com a nossa Visão Global.';
    expect(splitAboutSections(text)).toEqual([{ heading: null, body: text }]);
  });

  it('devolve lista vazia sem texto', () => {
    expect(splitAboutSections('')).toEqual([]);
  });
});

describe('toBlocks', () => {
  it('separa parágrafos e listas com marcadores', () => {
    expect(toBlocks('Primeiro parágrafo.\n\n• Um\n• Dois')).toEqual([
      { type: 'text', text: 'Primeiro parágrafo.' },
      { type: 'list', items: ['Um', 'Dois'] },
    ]);
  });

  it('transforma valores em etiquetas apenas quando pedido', () => {
    expect(toBlocks('Qualidade Rapidez Confiança')).toEqual([{ type: 'text', text: 'Qualidade Rapidez Confiança' }]);
    expect(toBlocks('Qualidade Rapidez Confiança', { valuesMode: true }))
      .toEqual([{ type: 'chips', items: ['Qualidade', 'Rapidez', 'Confiança'] }]);
    expect(toBlocks('Senso de Dono\nRespeito\nOrganização', { valuesMode: true }))
      .toEqual([{ type: 'chips', items: ['Senso de Dono', 'Respeito', 'Organização'] }]);
  });

  it('não parte valores com palavras minúsculas, pontuação ou frases longas', () => {
    expect(toBlocks('Senso de Dono Respeito', { valuesMode: true })).toEqual([{ type: 'text', text: 'Senso de Dono Respeito' }]);
    expect(toBlocks('Ética, Compromisso', { valuesMode: true })).toEqual([{ type: 'text', text: 'Ética, Compromisso' }]);
    const sentences = 'Priorizamos a parceria com os clientes.\nTrabalhamos sempre com ética e respeito.';
    expect(toBlocks(sentences, { valuesMode: true })).toEqual([{ type: 'text', text: sentences }]);
  });
});
