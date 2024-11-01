import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { Link } from 'react-router-dom';
import { db } from '../fb';

const ServicosExternos = () => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const categoriasRef = ref(db, 'categoriasExternas');

    onValue(categoriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoriasList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setCategorias(categoriasList);
      }
    });
  }, []);

  return (
    <div className="p-4 bg-white">
      <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0' }}>
        {categorias.map((categoria) => (
          <Link
            key={categoria.id}
            to={`/servicos/${categoria.name}`} 
            className="inline-block bg-gray-100 p-4 m-2 rounded-md shadow-md text-center min-w-[160px]">
            {categoria.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ServicosExternos;
