import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../fb';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PermissaoTrabalhoForm = () => {
  const [formData, setFormData] = useState({
    empresa: '',
    localTrabalho: '',
    equipamentoEnvolvido: '',
    descricaoTrabalho: '',
    riscos: [],
    equipamentosUtilizados: [],
    precaucoes: [],
    data: '',
    hora: '',
    nomeResponsavel: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
          ? [...formData[name], value]
          : formData[name].filter((v) => v !== value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Salva os dados no Firebase
    const ptRef = ref(db, `permissao_trabalho/${Date.now()}`);
    await set(ptRef, formData);

    navigate('/confirmacao');
  };

  // Função para gerar PDF
  const handleGeneratePDF = () => {
    const input = document.getElementById('pt-form');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save('permissao_trabalho.pdf');
    });
  };

  return (
    <div className="container mx-auto">
      <form id="pt-form" className="bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6">Permissão de Trabalho</h2>

        <div className="mb-4">
          <label className="block">Empresa</label>
          <input
            type="text"
            name="empresa"
            value={formData.empresa}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block">Local do Trabalho</label>
          <input
            type="text"
            name="localTrabalho"
            value={formData.localTrabalho}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block">Equipamento Envolvido</label>
          <input
            type="text"
            name="equipamentoEnvolvido"
            value={formData.equipamentoEnvolvido}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block">Descrição do Trabalho</label>
          <textarea
            name="descricaoTrabalho"
            value={formData.descricaoTrabalho}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block">Riscos Potenciais</label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <input
                type="checkbox"
                name="riscos"
                value="Explosão/Incêndio"
                onChange={handleChange}
              />
              Explosão/Incêndio
            </label>
            <label>
              <input
                type="checkbox"
                name="riscos"
                value="Queimaduras"
                onChange={handleChange}
              />
              Queimaduras
            </label>
            {/* Adicione os demais riscos */}
          </div>
        </div>

        <div className="mb-4">
          <label className="block">Equipamentos Utilizados</label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <input
                type="checkbox"
                name="equipamentosUtilizados"
                value="Máquina de Solda"
                onChange={handleChange}
              />
              Máquina de Solda
            </label>
            <label>
              <input
                type="checkbox"
                name="equipamentosUtilizados"
                value="Maçarico"
                onChange={handleChange}
              />
              Maçarico
            </label>
            {/* Adicione os demais equipamentos */}
          </div>
        </div>

        <div className="mb-4">
          <label className="block">Precauções</label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <input
                type="checkbox"
                name="precaucoes"
                value="Isolamento da área"
                onChange={handleChange}
              />
              Isolamento da área
            </label>
            {/* Adicione mais precauções conforme o formulário */}
          </div>
        </div>

        <div className="mb-4">
          <label className="block">Nome do Responsável</label>
          <input
            type="text"
            name="nomeResponsavel"
            value={formData.nomeResponsavel}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block">Data e Hora</label>
          <input
            type="date"
            name="data"
            value={formData.data}
            onChange={handleChange}
            required
            className="border p-2 w-full"
          />
          <input
            type="time"
            name="hora"
            value={formData.hora}
            onChange={handleChange}
            required
            className="border p-2 w-full mt-2"
          />
        </div>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Enviar Permissão
        </button>
        <button
          type="button"
          onClick={handleGeneratePDF}
          className="bg-green-500 text-white px-4 py-2 rounded ml-4"
        >
          Gerar PDF
        </button>
      </form>
    </div>
  );
};

export default PermissaoTrabalhoForm;
