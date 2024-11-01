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

  // Gerar o código de barras quando a fatura é carregada
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

  const Cliente = fatura?.cliente || '';
  const subtotal = fatura?.itens ? fatura.itens.reduce((acc, item) => acc + item.quantidade * item.preco, 0) : 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="p-5 md:p-10 bg-white rounded-lg shadow-lg">
      <div ref={faturaRef} className="fatura">
        <div style={{ padding: '20px', fontFamily: 'Arial', fontSize: '10px' }}>
          <img
            src={user.logoUrl || '/imagens/default-logo.png'}
            alt="Logotipo"
            style={{ maxWidth: '80px', height: 'auto' }}
          />
          <h1 style={{ textAlign: 'left' }}>Proforma #{numeroProforma}</h1>
          <div>
            <strong>Data de Emissão: {fatura.dataEmissao}</strong><br />
            <strong>Data de Vencimento: {fatura.dataVencimento}</strong><br />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            {fatura.cliente ? (
              <>
                <div>
                  <p><strong>Faturado a</strong><br />{fatura.cliente.nome}<br />{fatura.cliente.enderecoFaturado}<br />{fatura.cliente.nuit}</p>
                </div>
                <div>
                  <p><strong>Enviar para</strong><br />{fatura.cliente.nome}<br />{fatura.cliente.enderecoEnvio}<br />{fatura.cliente.codigoPostalEnvio}</p>
                </div>
              </>
            ) : (
              <p>Cliente desconhecido</p>
            )}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <svg ref={barcodeRef}></svg>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead style={{ backgroundColor: '#F1F1F1' }}>
              <tr>
                <th style={{ padding: '8px' }}>QTD</th>
                <th style={{ padding: '8px' }}>DESC</th>
                <th style={{ padding: '8px' }}>PREÇO UNIT</th>
                <th style={{ padding: '8px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {fatura.itens ? (
                fatura.itens.map((servico, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 px-4">{servico.quantidade}</td>
                    <td className="py-2 px-4">{servico.descricao}</td>
                    <td className="py-2 px-4">{servico.preco.toFixed(2)}</td>
                    <td className="py-2 px-4">{(servico.quantidade * servico.preco).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <p>SUBTOTAL: {subtotal.toFixed(2)} MZN</p>
            <p>IVA 16%: {iva.toFixed(2)} MZN</p>
            <h3>TOTAL: {total.toFixed(2)} MZN</h3>
          </div>
          <div style={{ marginTop: '20px', fontSize: '8pt' }}>
            <p><strong>Termos e Condições:</strong> O pagamento é devido no prazo de 15 dias</p>
            <p>Banco Finantia, S.A.<br />IBAN: PT32 3456 7891<br />SWIFT/BIC: ABCDPTM1XXX</p>
          </div>
          <div style={{ marginTop: '40px', textAlign: 'right' }}>
            <p>Assinatura:</p>
            <img src="/imagens/signature.png" alt="Assinatura" style={{ width: '150px' }} />
          </div>
        </div>
      </div>
      <button onClick={gerarPDF} className="bg-blue-600 text-white p-2 rounded mt-4">
        BAIXAR PDF
      </button>
    </div>
  );
};

export default Fatura;