import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useParams } from 'react-router-dom';
import { get, ref } from 'firebase/database';
import JsBarcode from 'jsbarcode';
import { db } from '../../fb';

const FaturaDesk = ({ user }) => {

  console.log(user)
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
      const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size in mm (210x297mm)
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Ajusta a escala da imagem para o formato A4
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Proforma_${numeroProforma}.pdf`);
    });
  };

  const Cliente = fatura?.cliente || '';
  const subtotal = fatura?.itens ? fatura.itens.reduce((acc, item) => acc + item.quantidade * item.preco, 0) : 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="flex justify-center items-center min-h-screen p-5">
      <div ref={faturaRef} className="fatura" style={{ width: '210mm', height: '297mm', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ padding: '20px', fontFamily: 'Arial', fontSize: '12px' }}>
          <img
            src={user.logoUrl || '/imagens/default-logo.png'}
            alt="Logotipo"
            style={{ maxWidth: '80px', height: 'auto' }}
          />
         

          {/* Grid de 2 colunas com Tailwind CSS */}
          <div className="grid grid-cols-2 gap-4 mt-4">
              <>
                <div>
                <h4>{user.nome}</h4>
                <h4>{user.nuit}</h4>
                <h4>{user.provincia}-{user.endereco}</h4>
                <h4>{user.email}-{user.contacto}</h4>
                <h1 style={{ textAlign: 'left', color: '#2c3e50', marginBottom: '10px' }}>Proforma #{numeroProforma}</h1>
         

         <div>
           <strong>Data de Emissão: {fatura.dataEmissao}</strong><br />
           <strong>Data de Vencimento: {fatura.dataVencimento}</strong><br />
         </div>
                </div>

                {/* Coluna 2: Endereço de envio */}
                <div>
                  <p><strong>Enviar para</strong><br />{fatura.cliente.nome}<br />{fatura.cliente.enderecoEnvio}<br />{fatura.cliente.codigoPostalEnvio}</p>
                </div>
              </>
           
          </div>


          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <svg ref={barcodeRef}></svg>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead style={{ backgroundColor: '#f1f1f1', fontWeight: 'bold' }}>
              <tr>
                <th style={{ padding: '8px', textAlign: 'left' }}>QTD</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>DESC</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>PREÇO UNIT</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>TOTAL</th>
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
        </div>

  <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', backgroundColor: '#f1f1f1' }}>
    <div style={{ width: '50%' }}>
      <p><strong>SUBTOTAL:</strong> {subtotal.toFixed(2)} MZN</p>
      <p><strong>IVA 16%:</strong> {iva.toFixed(2)} MZN</p>
    </div>
    <div style={{ width: '50%', textAlign: 'right' }}>
      <h3><strong>TOTAL:</strong> {total.toFixed(2)} MZN</h3>
    </div>
  </div>

  <div style={{ marginTop: '20px', fontSize: '8pt', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
    <p><strong>Termos e Condições:</strong> O pagamento é devido no prazo de 15 dias</p>
    <p>Banco Finantia, S.A.<br />IBAN: PT32 3456 7891<br />SWIFT/BIC: ABCDPTM1XXX</p>
  </div>

  <div style={{ marginTop: '40px', textAlign: 'right' }}>
    <p><strong>Assinatura:</strong></p>
    <img src="/imagens/signature.png" alt="Assinatura" style={{ width: '150px' }} />
  </div>
  <p className='text-center'><small>Gerado por: Connectionmozambique</small></p>

</div>
      </div>

      <button onClick={gerarPDF} className="bg-blue-600 text-white p-2 rounded mt-4">
        BAIXAR PDF
      </button>
    </div>
  );
};

export default FaturaDesk;
