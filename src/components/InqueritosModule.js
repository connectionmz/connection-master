import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';
import CriarInquerito from './CriarInquerito';

const InqueritosModule = () => {
  const [inqueritos, setInqueritos] = useState([]);

  useEffect(() => {
    // Buscar inquéritos da base de dados
    const inqueritosRef = ref(db, 'surveys');
    onValue(inqueritosRef, (snapshot) => {
      const data = snapshot.val();
      const listaInqueritos = data
        ? Object.entries(data).map(([id, details]) => ({ id, ...details }))
        : [];
      setInqueritos(listaInqueritos);
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Painel de Inquéritos</h1>
      <CriarInquerito />
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Lista de Inquéritos</h2>
        {inqueritos.length === 0 ? (
          <p className="text-gray-500">Nenhum inquérito criado ainda.</p>
        ) : (
          <ul className="mt-4">
            {inqueritos.map((inq) => (
              <li key={inq.id} className="border p-4 mb-2 rounded">
                <h3 className="font-bold">{inq.title}</h3>
                <p>{inq.description}</p>
                <p className="text-sm text-gray-500">
                  Criado em: {new Date(inq.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InqueritosModule;
