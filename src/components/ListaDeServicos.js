import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb'; 
import { useParams } from 'react-router-dom';

const ListaDeServicos = () => {
  const { categoriaId } = useParams(); 
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    const servicosRef = ref(db, `servicosExternos/`);

    onValue(servicosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const servicosList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setServicos(servicosList);
      }
    });
  }, [categoriaId]);

  return (
    <div className="p-4 bg-white">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Serviços da Categoria {}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicos.map((servico) => (
          <div key={servico.id} className="bg-gray-100 p-4 rounded-md shadow-md">
            <h3 className="font-semibold">{servico.serviceName}</h3>
            <p>{servico.description}</p>
            <a
              href={servico.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Visitar Site
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
export default ListaDeServicos;
