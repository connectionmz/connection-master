import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../fb'; 
import { onAuthStateChanged } from 'firebase/auth';

const Cotacoes = () => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [loggedInUser, setLoggedInUser] = useState(null); 
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setLoggedInUser(user || null);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const cotacoesRef = ref(db, 'cotacoes');
        onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val() || {};
            const cotacoesList = Object.entries(cotacoesData).map(([id, data]) => ({
                id,
                ...data,
            }));
            setCotacoes(cotacoesList);
        });
    }, []);

    const handlePublishCotacao = () => navigate('/publicar-cotacao');

    const deleteCotacao = (cotacaoId) => {
        remove(ref(db, `cotacoes/${cotacaoId}`))
            .then(() => console.log(`Cotação ${cotacaoId} excluída.`))
            .catch((error) => console.error('Erro ao excluir a cotação: ', error));
    };

    const handleCotacaoClick = (id, companyId) => navigate(`/cotacao/${id}/${companyId}`);

    const isExpired = (datalimite) => new Date() > new Date(datalimite);

    const filteredCotacoes = cotacoes.filter(cotacao => {
        if (activeTab === 'recentes') return new Date().toDateString() === new Date(cotacao.timestamp).toDateString();
        if (activeTab === 'expiradas') return isExpired(cotacao.datalimite);
        if (activeTab === 'Fechada') return cotacao.status === 'Fechada';
        if (activeTab === 'minhas') return cotacao?.company?.id === loggedInUser?.uid;
        return true;
    });

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Cotações</h1>
                <button 
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    onClick={handlePublishCotacao}
                >
                    Emitir Cotação
                </button>
            </div>

            <div className="flex border-b mb-4 overflow-x-auto">
                {['recentes', 'expiradas', 'Fechada', 'minhas'].map(tab => (
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
                {filteredCotacoes.length ? (
                    <div className="space-y-4">
                        {filteredCotacoes.map(cotacao => (
                            <div 
                                key={cotacao.id} 
                                className={`p-4 border rounded-lg bg-white shadow-md cursor-pointer ${isExpired(cotacao.datalimite) ? 'bg-gray-200' : ''}`}
                                onClick={() => handleCotacaoClick(cotacao.id, cotacao.company?.id)}
                            >
                                <h3 className="text-md font-bold mb-2">{cotacao?.title}</h3>
                                <p className="text-gray-500">Data Limite: {new Date(cotacao.datalimite).toLocaleDateString()}</p>
                                <div className="flex items-center mb-4">
                                    <img src={cotacao.company?.logoUrl || 'https://via.placeholder.com/64'} alt={cotacao.company?.nome || 'Empresa Desconhecida'} className="w-16 h-16 object-cover rounded-full mr-4" />
                                    <div>
                                        <h2 className="text-lg font-semibold">{cotacao.company?.nome || 'Empresa Desconhecida'}</h2>
                                    </div>
                                </div>
                                {loggedInUser?.uid === cotacao?.company?.id && (
                                    <button onClick={() => deleteCotacao(cotacao?.id)} className="text-red-500 hover:underline ml-4">
                                        Excluir
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">Nenhuma cotação disponível.</p>
                )}
            </div>
        </div>
    );
};

export default Cotacoes;
