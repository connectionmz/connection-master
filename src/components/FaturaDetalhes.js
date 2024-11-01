import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { get, ref } from 'firebase/database';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../fb';

const Fatura = ({ user }) => {
    const faturaRef = useRef();
    const { id } = useParams();
    const [fatura, setFatura] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFatura = async () => {
            const faturaRef = ref(db, `invoices/${user.id}`);
            const snapshot = await get(faturaRef);
            if (snapshot.exists()) {
                setFatura(snapshot.val());
            }
            setLoading(false);
        };
        fetchFatura();
    }, [id, user.id]);

    const gerarPDF = () => {
        const input = faturaRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('fatura.pdf');
        });
    };

    if (loading) {
        return <p>Carregando...</p>;
    }

    if (!fatura) {
        return <p>Fatura não encontrada.</p>;
    }

    const Cliente = fatura.cliente;
    const subtotal = fatura.items.reduce((acc, item) => acc + item.quantidade * item.preco, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return (
        <div>
            <div ref={faturaRef} className="fatura">
                <div style={{ padding: '20px', fontFamily: 'Arial', fontSize: '12px' }}>
                    <h1 style={{ textAlign: 'right' }}>PROFORMA #{fatura.numeroProforma}</h1>
                    <div>
                        <strong>Data de Emissão: {fatura.dataEmissao}</strong><br />
                        <strong>Data de Vencimento: {fatura.dataVencimento}</strong><br />
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        {Cliente ? (
                            <>
                                <div>
                                    <p><strong>Faturado a</strong><br />{Cliente.nome}<br />{Cliente.enderecoFaturado}<br />{Cliente.nuit}</p>
                                </div>
                                <div>
                                    <p><strong>Enviar para</strong><br />{Cliente.nome}<br />{Cliente.enderecoEnvio}<br />{Cliente.codigoPostalEnvio}</p>
                                </div>
                            </>
                        ) : (
                            <p>Cliente desconhecido</p>
                        )}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #000', padding: '5px' }}>QTD</th>
                                <th style={{ border: '1px solid #000', padding: '5px' }}>DESCRIÇÃO</th>
                                <th style={{ border: '1px solid #000', padding: '5px' }}>PREÇO POR UNIDADE</th>
                                <th style={{ border: '1px solid #000', padding: '5px' }}>VALOR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fatura.items.map((servico, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-2 px-4">{servico.quantidade}</td>
                                    <td className="py-2 px-4">{servico.descricao}</td>
                                    <td className="py-2 px-4">{servico.preco.toFixed(2)} MZN</td>
                                    <td className="py-2 px-4">{(servico.quantidade * servico.preco).toFixed(2)} MZN</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '10px', textAlign: 'right' }}>
                        <p>Subtotal: {subtotal.toFixed(2)} MZN</p>
                        <p>IVA 16%: {iva.toFixed(2)} MZN</p>
                        <h3>TOTAL: {total.toFixed(2)} MZN</h3>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <p><strong>Termos e Condições:</strong> O pagamento é devido no prazo de 15 dias</p>
                        <p>Banco Finantia, S.A.<br />IBAN: PT32 3456 7891<br />SWIFT/BIC: ABCDPTM1XXX</p>
                    </div>
                    <div style={{ marginTop: '40px', textAlign: 'right' }}>
                        <p>Assinatura:</p>
                        <img src="/path/to/signature.png" alt="Assinatura" style={{ width: '150px' }} />
                    </div>
                </div>
            </div>
            <button onClick={gerarPDF} className="bg-blue-600 text-white p-2 rounded mt-4">
                Download PDF
            </button>
        </div>
    );
}

export default Fatura;
