import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../fb'; 
import { onAuthStateChanged } from 'firebase/auth';

const Concursos = ({user}) => {
    const [concursos, setConcursos] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [loggedInUser, setLoggedInUser] = useState(null); 
    const navigate = useNavigate();

    // Verifica autenticação do usuário
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setLoggedInUser(user || null);
        });
        return () => unsubscribeAuth();
    }, []);

    // Busca concursos do Firebase
    useEffect(() => {
        const concursosRef = ref(db, 'concursos');
        onValue(concursosRef, (snapshot) => {
            const concursosData = snapshot.val() || {};
            const concursosList = Object.entries(concursosData).map(([id, data]) => ({
                id,
                ...data,
            }));
            setConcursos(concursosList);
        });
    }, []);

    // Navega para página de publicação
    const handlePublishConcurso = () => navigate('/publicar-concurso');

    // Exclui um concurso
    const deleteConcurso = (concursoId) => {
        remove(ref(db, `concursos/${concursoId}`))
            .then(() => console.log(`Concurso ${concursoId} excluído.`))
            .catch((error) => console.error('Erro ao excluir o concurso: ', error));
    };

    // Navega para detalhes do concurso
    const handleConcursoClick = (id, companyId) => navigate(`/concursos/${id}/${companyId}`);

    // Verifica se o concurso está expirado
    const isExpired = (datalimite) => new Date() > new Date(datalimite);

    // Filtra concursos por aba ativa
    const filteredConcursos = concursos.filter((concurso) => {
        if (activeTab === 'recentes') return new Date().toDateString() === new Date(concurso.timestamp).toDateString();
        if (activeTab === 'expirados') return isExpired(concurso.datalimite);
        if (activeTab === 'Fechada') return concurso.status === 'Fechada';
        if (activeTab === 'meus') return concurso?.company?.id === loggedInUser?.uid;
        return true;
    });

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Concursos</h1>
                <button 
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    onClick={handlePublishConcurso}>
                    Publicar Concurso 
                </button>
            </div>
            <div className="flex border-b mb-4 overflow-x-auto">
                {['recentes', 'expirados', 'Fechada', 'meus'].map((tab) => (
                    <button
                        key={tab}
                        className={`py-2 px-4 ${activeTab === tab ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            <div>
                {filteredConcursos.length ? (
                    <div className="space-y-4">
                        {filteredConcursos.map((concurso) => (
                            <div 
                                key={concurso.id} 
                                className={`p-4 border rounded-lg bg-white shadow-md cursor-pointer ${isExpired(concurso.datalimite) ? 'bg-gray-200' : ''}`}
                                onClick={() => handleConcursoClick(concurso.id, concurso.company?.id)}>
                                <h3 className="text-md font-bold mb-2">{concurso?.titulo}</h3>
                                <p>Prazo de Propostas: {new Date(concurso.prazo).toLocaleDateString()}</p>
                                <p>Valor Estimado: {concurso.valorEstimado}</p>
                                <div className="flex items-center mb-4">
                                    <img src={concurso.company?.logoUrl || 'https://via.placeholder.com/64'} alt={concurso.company?.nome || 'Empresa Desconhecida'} className="w-16 h-16 object-cover rounded-full mr-4" />
                                    <div>
                                        <h2 className="text-lg font-semibold">{concurso.company?.nome || 'Empresa Desconhecida'}</h2>
                                    </div>
                                </div>
                                {loggedInUser?.uid === concurso?.company?.id && (
                                    <>
                                        <span>Setor: {concurso.sector}</span>
                                        <button 
                                            onClick={() => deleteConcurso(concurso?.id)} 
                                            className="text-red-500 hover:underline ml-4">
                                            Excluir
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600 text-center">Nenhum concurso disponível.</p>
                )}
            </div>
        </div>
    );
};

export default Concursos;
