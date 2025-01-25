import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';

const ConcursoDetalhes = () => {
    const { id } = useParams();
    const [concurso, setConcurso] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const concursoRef = ref(db, `concursos/${id}`);
        onValue(concursoRef, (snapshot) => {
            setConcurso(snapshot.val());
        });
    }, [id]);

    if (!concurso) {
        return <p>Carregando detalhes do concurso...</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{concurso?.title}</h1>
            <p className="mb-4"><strong>Data de Abertura:</strong> {new Date(concurso.dataAbertura).toLocaleDateString()}</p>
            <p className="mb-4"><strong>Prazo:</strong> {new Date(concurso.datalimite).toLocaleDateString()}</p>
            <h2 className="text-lg font-semibold mt-6">Descrição</h2>
            <div dangerouslySetInnerHTML={{ __html: concurso.description }} className="mb-4"></div>
            <h2 className="text-lg font-semibold mt-6">Critérios</h2>
            <p className="mb-4">{concurso.criterios}</p>
            <button 
                onClick={() => navigate('/concursos')}
                className="bg-blue-500 text-white py-2 px-4 rounded mt-6"
            >
                Voltar aos Concursos
            </button>
        </div>
    );
};

export default ConcursoDetalhes;
