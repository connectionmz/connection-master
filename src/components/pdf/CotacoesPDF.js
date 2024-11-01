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
    });
  }, [id]);

  console.log(cot)

  const generatePDF = () => {
    const content = document.querySelector("#pdfContent");
  
    if (content) {
      const doc = new jsPDF('p', 'mm', 'a4');
      html2canvas(content, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
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
    return <p>Carregando cotação...</p>;
  }

  return (
    <div>
      <div id="pdfContent" className="p-6 bg-white">
      <div className="p-6 bg-white max-w-full md:max-w-3xl mx-auto">
  <div className="flex flex-col md:flex-row justify-between items-center mb-4">
    <div className="text-center md:text-left">
      <h1 className="text-2xl font-bold">CONNECTIONS</h1>
      <p>Data: {cot.timestamp ? cot.timestamp : 'N/A'} | #{cot.title}</p>
      <h2>Pedido: {cot.title}</h2>
      <p>{cot.datalimite}</p>
    </div>
    <div className="mt-4 md:mt-0">
      <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto md:mx-0" />
    </div>
  </div>
</div>

        
        <div className="mb-4">
          <p><strong>A/C:</strong></p>
          <p>Sector de actividade: {cot?.sector || 'Cliente não informado'}</p>
        </div>

        <div className="overflow-x-auto">
  <table className="w-full border-collapse mb-4">
    <thead>
      <tr>
        <th className="border px-4 py-2">SERVIÇO/PRODUTO</th>
        <th className="border px-4 py-2">DESCRIÇÃO</th>
      </tr>
    </thead>
    <tbody>
      {cot.items?.map((item, index) => (
        <tr key={index}>
          <td className="border px-4 py-2">{item.name}</td>
          <td className="border px-4 py-2">
            <ul className="list-disc ml-4">
              {item.description?.split('\n').map((desc, idx) => (
                <li key={idx}>{desc}</li>
              ))}
            </ul>
          </td>
          <td className="border px-4 py-2">{item.price || 'N/A'}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


        <div className="mt-4">
          <p><strong>A Proposta</strong></p>
          <p className="text-gray-600 text-lg mb-6" dangerouslySetInnerHTML={{ __html: cot.description }}></p>
          </div>
        <div className="flex justify-between items-center mt-8">
          <div>
            <p>{cot.company.contacto}</p>
            <p>{cot?.company?.website || ''}</p>
            <p>{cot?.company?.email || ''}</p>
          </div>
          <div>
          </div>
        </div>
      </div>

      <button onClick={generatePDF} className="bg-green-600 text-white py-2 px-4 rounded-lg mt-4">
        Baixar PDF
      </button>
    </div>
  );
};
export default CotacoesPDF;
