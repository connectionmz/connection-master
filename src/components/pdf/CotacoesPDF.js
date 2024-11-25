import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from '../../fb';
import { useParams } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';

const CotacoesPDF = () => {
  const { id } = useParams();
  const [cot, setCotacao] = useState(null);

  useEffect(() => {
    const cotacaoRef = ref(db, `cotacoes/${id}`);

    onValue(cotacaoRef, (snapshot) => {
      const data = snapshot.val();
      setCotacao(data);
      console.log(data)
    });
  }, [id]);

  const generatePDF = () => {
    const content = document.querySelector("#pdfContent");
    if (content) {
      const doc = new jsPDF('p', 'mm', 'a4');
      html2canvas(content, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        doc.save('cotacao.pdf');
      });
    }
  };
  
  if (!cot) {
    return <p className="text-center text-gray-500 mt-10">Carregando cotação...</p>;
  }
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div id="pdfContent" className="bg-white shadow-lg rounded-lg max-w-4xl mx-auto p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">Pedido de Cotação</h1>
          <p className="text-gray-500 text-center">
            <strong>Data:</strong> {cot.timestamp || 'N/A'}
          </p>
        </header>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Informações da Cotação</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Título:</strong> {cot.title}</p>
              <p><strong>Data limite:</strong> {cot.datalimite}</p>
            </div>
            <div>
              <p><strong>Sector:</strong> {cot.sector || 'Não informado'}</p>
            </div>
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Itens da Cotação</h2>
          <div className="overflow-x-auto mt-4">
            <table className="table-auto w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="border px-4 py-2 text-left">Serviço/Produto</th>
                  <th className="border px-4 py-2 text-left">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {cot.items?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2">
                      <ul className="list-disc ml-4">
                        {item.description?.split('\n').map((desc, idx) => (
                          <li key={idx}>{desc}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Descrição da Proposta</h2>
          <p
            className="mt-4 text-gray-600"
            dangerouslySetInnerHTML={{ __html: cot.description }}
          ></p>
        </section>

        <footer className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700">Contato</h2>
          <p>{cot.company.contacto}</p>
          <p>{cot?.company?.social.facebook || ''}</p>
          <p>{cot?.company?.social.linkedin || ''}</p>
          <p>{cot?.company?.social.instagram || ''}</p>
          <p>{cot?.company?.social.website || ''}</p>
          <p>{cot?.company?.social.whatsappUrl || ''}</p>
        </footer>
      </div>
      <button
        onClick={generatePDF}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg mt-6 mx-auto block shadow-lg">
        Baixar PDF
      </button>
    </div>
  );
};
export default CotacoesPDF;
