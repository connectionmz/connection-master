import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';

const Propostas = () => {
  const { id } = useParams();
  const [propostas, setPropostas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const propostasRef = ref(db, `cotacoes/${id}/proposals`);
    
    onValue(propostasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const propostasArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setPropostas(propostasArray);
      } else {
        setPropostas([]);
      }
    });
  }, [id]);

  const handlePropostaClick = (propostaId) => {
    navigate(`/cotacao/${id}/proposta/${propostaId}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Propostas Recebidas</h1>
      
      {propostas.length > 0 ? (
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b text-left text-gray-600">Empresa</th>
              <th className="px-4 py-2 border-b text-left text-gray-600">Status</th>
              <th className="px-4 py-2 border-b text-left text-gray-600">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {propostas.map((proposta) => (
              <tr 
                key={proposta.id} 
                className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => handlePropostaClick(proposta.id)}
              >
                <td className="px-4 py-2 border-b text-gray-700"><small><a href=''>{proposta.from.nome}</a></small></td>
                <td className="px-4 py-2 border-b text-gray-500">
                  {proposta.status || 'Pendente'}
                </td>
                <td className="px-4 py-2 border-b text-blue-600 underline">
                 Abrir
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">Nenhuma proposta recebida.</p>
      )}
      
      <button
        onClick={() => navigate(`/cotacao/${id}`)}
        className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
        Voltar
      </button>
    </div>
  );
};

export default Propostas;
