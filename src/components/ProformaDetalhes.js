import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ref, get } from 'firebase/database'; 
import { db } from '../fb'; 
import { useParams } from 'react-router-dom';

const ProformaDetalhes = ({ user }) => {
  const [proforma, setProforma] = useState(null);
  const [error, setError] = useState(null);
  const { numeroProforma } = useParams(); // Obtém o número da proforma da URL
  const proformaRef = useRef(); // Referência para a área que será convertida em PDF

  // Buscar a proforma específica do Firebase com base no ID e no número da proforma
  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(ref(db, `invoices/${user.id}/${numeroProforma}`));
        if (proformaSnap.exists()) {
          setProforma(proformaSnap.val());
        } else {
          setError('Proforma não encontrada.');
        }
      } catch (err) {
        setError('Erro ao carregar proforma.');
      }
    };

    if (user && numeroProforma) {
      fetchProforma();
    }
  }, [user, numeroProforma]);

  // Função para gerar PDF
  const generatePDF = async () => {
    const element = proformaRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });
    
    const imgWidth = 595.28;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Proforma-${proforma.numeroProforma}.pdf`);
  };

  if (!proforma) return error ? <p>{error}</p> : <p>Carregando...</p>;

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md shadow-lg w-1/2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Proforma #{proforma.numeroProforma}</h2>
        </div>

        {/* Container a ser convertido em PDF */}
        <div ref={proformaRef} className="relative p-6">
          {/* Adicione aqui o logo e o cabeçalho */}
          <div className="flex justify-between items-start mb-6">
            <img src="path_to_logo" alt="Logo TurboHost" className="w-32"/>
            <div className="text-right">
              <p>TurboHost</p>
              <p>suporte@turbohost.co.mz | +258843670086</p>
              <p>2º Andar, 370 Av. 24 de Julho, Maputo</p>
              <p><strong>NUIT:</strong> 107497986</p>
            </div>
          </div>

          {/* Seção Proforma */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Proforma #{proforma.numeroProforma}</h3>
            <p><strong>Data de Emissão:</strong> {proforma.dataEmissao}</p>
            <p><strong>Vencimento:</strong> {proforma.vencimento || 'Indefinido'}</p>
          </div>

          {/* Seção Cliente */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Faturado a:</h3>
            <p><strong>Empresa:</strong> {proforma.cliente}</p>
            <p>Rua da Baixa, Pemba, MZ, 1000</p>
            <p><strong>À atenção de:</strong> {proforma.cliente}</p>
          </div>

          {/* Tabela de Descrição */}
          <table className="w-full border-collapse border border-gray-200 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Descrição</th>
                <th className="border p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">{proforma.descricao || 'Descrição não disponível'}</td>
                <td className="border p-2">{proforma.total}MT</td>
              </tr>
            </tbody>
          </table>

          <div className="mb-4">
            <p><strong>Sub Total:</strong> {proforma.subTotal}MT</p>
            <p><strong>Crédito:</strong> {proforma.credito}MT</p>
            <p><strong>Total:</strong> {proforma.total}MT</p>
          </div>

          {/* Tabela de Transações */}
          <h3 className="text-lg font-semibold">Transações:</h3>
          <table className="w-full border-collapse border border-gray-200 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Data</th>
                <th className="border p-2">Método</th>
                <th className="border p-2">Referência</th>
                <th className="border p-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {proforma.transacoes && proforma.transacoes.length > 0 ? (
                proforma.transacoes.map((transacao, index) => (
                  <tr key={index}>
                    <td className="border p-2">{transacao.data}</td>
                    <td className="border p-2">{transacao.metodo}</td>
                    <td className="border p-2">{transacao.referencia}</td>
                    <td className="border p-2">{transacao.valor}MT</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border p-2 text-center">Sem transações</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Balanço */}
          <div className="text-right">
            <p><strong>Balanço:</strong> {proforma.balanco}MT</p>
          </div>

          {/* Rodapé */}
          <div className="text-right mt-6">
            <p>PDF criado em {proforma.dataEmissao}</p>
          </div>

          {/* Adicione o aviso "POR PAGAR" se necessário */}
          <div className="absolute top-0 right-0 p-4 text-white bg-red-500">
            POR PAGAR
          </div>
        </div>

        {/* Botão para gerar PDF */}
        <div className="text-right mt-4">
          <button 
            onClick={generatePDF} 
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProformaDetalhes;
