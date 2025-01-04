import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useParams } from 'react-router-dom';
import { db } from '../../fb';
import { get, ref } from 'firebase/database';
import JsBarcode from 'jsbarcode';

const Fatura = ({ user }) => {
  const faturaRef = useRef();
  const barcodeRef = useRef();
  const [fatura, setProforma] = useState([]);
  const [error, setError] = useState(null);
  const { numeroProforma } = useParams();

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

  useEffect(() => {
    if (numeroProforma && barcodeRef.current) {
      JsBarcode(barcodeRef.current, numeroProforma, {
        format: 'CODE128',
        lineColor: '#000',
        width: 1,
        height: 20,
        displayValue: true,
      });
    }
  }, [numeroProforma]);

  const gerarPDF = () => {
    const input = faturaRef.current;
    if (!input) {
      console.error('Elemento de referência da fatura não encontrado.');
      return;
    }
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Proforma_${numeroProforma}.pdf`);
    });
  };

  const subtotal = fatura?.itens
    ? fatura.itens.reduce((acc, item) => acc + item.quantidade * item.preco, 0)
    : 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="p-5 bg-gray-100 flex justify-center items-center min-h-screen">
      <div
        ref={faturaRef}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-3xl"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        <div className="text-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <img
                src={user.logoUrl || '/imagens/default-logo.png'}
                alt="Logotipo"
                className="w-20"
              />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-bold">Proforma #{numeroProforma}</h1>
              <p className="text-gray-500">Data de Emissão: {fatura.dataEmissao}</p>
              <p className="text-gray-500">Data de Vencimento: {fatura.dataVencimento}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <p className="font-bold">Faturado a</p>
              {fatura.cliente ? (
                <>
                  <p>{fatura.cliente.nome}</p>
                  <p>{fatura.cliente.enderecoFaturado}</p>
                  <p>{fatura.cliente.nuit}</p>
                </>
              ) : (
                <p>Cliente desconhecido</p>
              )}
            </div>
            <div>
              <p className="font-bold">Enviar para</p>
              {fatura.cliente ? (
                <>
                  <p>{fatura.cliente.nome}</p>
                  <p>{fatura.cliente.enderecoEnvio}</p>
                  <p>{fatura.cliente.codigoPostalEnvio}</p>
                </>
              ) : (
                <p>Cliente desconhecido</p>
              )}
            </div>
          </div>

          <div className="text-right mb-8">
            <svg ref={barcodeRef} className="w-48"></svg>
          </div>

          <table className="w-full border border-gray-300 text-sm mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">QTD</th>
                <th className="border px-4 py-2 text-left">DESC</th>
                <th className="border px-4 py-2 text-right">PREÇO UNIT</th>
                <th className="border px-4 py-2 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {fatura.itens ? (
                fatura.itens.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{item.quantidade}</td>
                    <td className="border px-4 py-2">{item.descricao}</td>
                    <td className="border px-4 py-2 text-right">{item.preco.toFixed(2)}</td>
                    <td className="border px-4 py-2 text-right">
                      {(item.quantidade * item.preco).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="text-right text-sm">
            <p>SUBTOTAL: {subtotal.toFixed(2)} MZN</p>
            <p>IVA 16%: {iva.toFixed(2)} MZN</p>
            <h3 className="text-lg font-bold">TOTAL: {total.toFixed(2)} MZN</h3>
          </div>

          <div className="mt-8 text-xs">
            <p className="font-bold">Termos e Condições:</p>
            <p>O pagamento é devido no prazo de 15 dias.</p>
            <p>Banco Finantia, S.A.<br />IBAN: PT32 3456 7891<br />SWIFT/BIC: ABCDPTM1XXX</p>
          </div>

          <div className="mt-12 text-right">
            <p>Assinatura:</p>
            <img
              src="/imagens/signature.png"
              alt="Assinatura"
              className="w-32 mt-2"
            />
          </div>
        </div>
      </div>

      <button
        onClick={gerarPDF}
        className="bg-blue-600 text-white p-2 rounded mt-4 shadow"
      >
        BAIXAR PDF
      </button>
    </div>
  );
};

export default Fatura;
