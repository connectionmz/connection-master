import React, { useState } from 'react';
import { ref, push } from 'firebase/database';
import { db } from '../fb';

const CriarInquerito = () => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setor, setSetor] = useState('');
  const [tipoInquerito, setTipoInquerito] = useState('');
  const [perguntas, setPerguntas] = useState([]);

  const opcoesSetores = [
    'Saúde',
    'Educação',
    'Tecnologia',
    'Agricultura',
    'Serviços Financeiros',
  ];

  const tiposInqueritos = [
    'Satisfação do Cliente',
    'Pesquisa de Mercado',
    'Avaliação Interna',
    'Outro',
  ];

  const adicionarPergunta = (tipo) => {
    setPerguntas([
      ...perguntas,
      { tipo, texto: '', opcoes: tipo === 'multipla_escolha' ? [''] : [] },
    ]);
  };

  const atualizarPergunta = (index, texto) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index].texto = texto;
    setPerguntas(novasPerguntas);
  };

  const atualizarOpcao = (indexPergunta, indexOpcao, texto) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[indexPergunta].opcoes[indexOpcao] = texto;
    setPerguntas(novasPerguntas);
  };

  const adicionarOpcao = (index) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index].opcoes.push('');
    setPerguntas(novasPerguntas);
  };

  const salvarInquerito = () => {
    if (!titulo || !descricao || !setor || !tipoInquerito || perguntas.length === 0) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const inqueritoRef = ref(db, 'surveys');
    const novoInquerito = {
      title: titulo,
      description: descricao,
      setor,
      tipoInquerito,
      questions: perguntas,
      createdAt: Date.now(),
    };

    push(inqueritoRef, novoInquerito);

    setTitulo('');
    setDescricao('');
    setSetor('');
    setTipoInquerito('');
    setPerguntas([]);
    alert('Inquérito criado com sucesso!');
  };

  return (
    <div className="border p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Criar Novo Inquérito</h2>
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título do Inquérito"
        className="border p-2 w-full mb-4"
      />
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição"
        className="border p-2 w-full mb-4"
      ></textarea>

      <select
        value={setor}
        onChange={(e) => setSetor(e.target.value)}
        className="border p-2 w-full mb-4"
      >
        <option value="">Selecione o Setor de Atividade</option>
        {opcoesSetores.map((opcao, index) => (
          <option key={index} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>

      <select
        value={tipoInquerito}
        onChange={(e) => setTipoInquerito(e.target.value)}
        className="border p-2 w-full mb-4"
      >
        <option value="">Selecione o Tipo de Inquérito</option>
        {tiposInqueritos.map((opcao, index) => (
          <option key={index} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>

      <h3 className="font-semibold mb-2">Perguntas</h3>
      {perguntas.map((pergunta, index) => (
        <div key={index} className="border p-2 mb-4 rounded">
          <input
            type="text"
            value={pergunta.texto}
            onChange={(e) => atualizarPergunta(index, e.target.value)}
            placeholder={`Pergunta ${index + 1}`}
            className="border p-2 w-full mb-2"
          />
          {pergunta.tipo === 'multipla_escolha' && (
            <div className="mt-2">
              <h4 className="font-medium">Opções:</h4>
              {pergunta.opcoes.map((opcao, i) => (
                <input
                  key={i}
                  type="text"
                  value={opcao}
                  onChange={(e) => atualizarOpcao(index, i, e.target.value)}
                  placeholder={`Opção ${i + 1}`}
                  className="border p-2 w-full mb-2"
                />
              ))}
              <button
                onClick={() => adicionarOpcao(index)}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
              >
                Adicionar Opção
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-4 mt-4">
        <button
          onClick={() => adicionarPergunta('aberta')}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Adicionar Pergunta Aberta
        </button>
        <button
          onClick={() => adicionarPergunta('multipla_escolha')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Adicionar Pergunta de Múltipla Escolha
        </button>
      </div>

      <button
        onClick={salvarInquerito}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4"
      >
        Salvar Inquérito
      </button>
    </div>
  );
};

export default CriarInquerito;
