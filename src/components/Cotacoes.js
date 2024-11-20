import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../fb'; // Certifique-se de importar o auth do Firebase
import { onAuthStateChanged } from 'firebase/auth';

const Cotacoes = () => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes'); // Controla a tab ativa
    const [loggedInUser, setLoggedInUser] = useState(null); // Estado para o usuário logado
    const [snackbarMessage, setSnackbarMessage] = useState(''); // Mensagem para o snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false); // Estado para controle da visibilidade do snackbar
    const navigate = useNavigate();

    // Listener para autenticação do usuário
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setLoggedInUser(user); // Defina o usuário logado
            } else {
                setLoggedInUser(null); // Nenhum usuário logado
            }
        });

        return () => {
            unsubscribeAuth();
        };
    }, []);

    useEffect(() => {
        const cotacoesRef = ref(db, 'cotacoes');

        // Listener para cotações
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val() || {};
            const cotacoesList = Object.entries(cotacoesData).map(([id, data]) => ({
                id,
                ...data
            }));
            setCotacoes(cotacoesList);
        });

        return () => {
            unsubscribeCotacoes();
        };
    }, [db]);

    const handlePublishQuotation = () => {
        navigate('/publicar-cotacao');
    };

    const deleteCotacao = (cotacaoId) => {
        if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
            const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
            remove(cotacaoRef)
                .then(() => {
                    setSnackbarMessage('Cotação excluída com sucesso!');
                    setSnackbarOpen(true);
                    setTimeout(() => setSnackbarOpen(false), 3000); // Esconde o snackbar após 3 segundos
                })
                .catch((error) => {
                    console.error('Erro ao excluir a cotação: ', error);
                });
        }
    };

    const handleCotacaoClick = (id, companyId) => {
        navigate(`/cotacao/${id}/${companyId}`);
    };

    const isExpired = (datalimite) => {
        const currentDate = new Date();
        const deadline = new Date(datalimite);
        return currentDate > deadline;
    };

    const isRecent = (timestamp) => {
        const currentDate = new Date();
        const cotacaoDate = new Date(timestamp);
        return currentDate.toDateString() === cotacaoDate.toDateString();
    };

    const updateStatusToExpired = (cotacaoId) => {
        const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
        update(cotacaoRef, { status: 'expired' })
            .then(() => {
                console.log(`Cotação ${cotacaoId} marcada como expirada.`);
            })
            .catch((error) => {
                console.error('Erro ao atualizar o status da cotação: ', error);
            });
    };

    const renderCotacao = (cotacao, expired) => (
        <div 
            key={cotacao.id} 
            className={`p-4 border rounded-lg bg-white shadow-md cursor-pointer ${expired ? 'bg-gray-200' : ''}`}
            onClick={() => handleCotacaoClick(cotacao.id, cotacao.company.id)}
            title={expired ? 'Cotação expirada' : ''}
        >
            <div className="flex items-center mb-4">
                <img 
                    src={cotacao.company?.logoUrl || 'https://via.placeholder.com/64'} 
                    alt={cotacao.company?.nome || 'Empresa Desconhecida'} 
                    className="w-16 h-16 object-cover rounded-full mr-4"
                />
                <div>
                    <h2 className="text-lg font-semibold">
                        {cotacao.company?.nome || 'Empresa Desconhecida'}
                    </h2>
                </div>
            </div>
            {loggedInUser?.uid === cotacao?.company?.id && (
                    <button
                        onClick={() => deleteCotacao(cotacao?.id)}
                        className="text-red-500 hover:underline ml-4"
                    >
                        Excluir
                    </button>
                )}
            <h3 className="text-md font-bold mb-2">{cotacao?.title}</h3>
            <p className="text-gray-500 mb-1">
                Data de Publicação: {new Date(cotacao?.timestamp).toLocaleDateString()}
            </p>
            <p className={`text-${expired ? 'red-500' : 'gray-500'} mb-1`}>
                {expired ? 'Cotação Expirada' : `Data Limite: ${new Date(cotacao.datalimite).toLocaleDateString()}`}
            </p>
            <div className="space-y-2 mt-4">
                {(cotacao.items || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start mb-4">
                        <img 
                            src={item.imageUrl || 'https://via.placeholder.com/64'} 
                            alt={item.name} 
                            className="w-16 h-16 object-cover rounded mr-4"
                        />
                        <div>
                            <h4 className="text-md font-semibold">{item.name}</h4>
                            <p className="text-gray-500">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const filteredCotacoes = () => {
        switch (activeTab) {
            case 'recentes':
                return cotacoes.filter(cotacao => isRecent(cotacao.timestamp));
            case 'expiradas':
                return cotacoes.filter(cotacao => {
                    const expired = isExpired(cotacao.datalimite);
                    if (expired && cotacao.status !== 'expired') {
                        updateStatusToExpired(cotacao.id);
                    }
                    return expired;
                });
            case 'Fechada':
                return cotacoes.filter(cotacao => cotacao.status === 'Fechada');
            case 'minhas':
                return cotacoes.filter(cotacao => cotacao?.company?.id === loggedInUser?.uid);
            default:
                return cotacoes;
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Cotações</h1>
                <button 
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    onClick={handlePublishQuotation}
                >
                    Emitir
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-4 overflow-x-auto scrollbar-hide">
                <button
                    className={`py-2 px-4 ${activeTab === 'recentes' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('recentes')}
                >
                    Recentes
                </button>
                <button
                    className={`py-2 px-4 ${activeTab === 'expiradas' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('expiradas')}
                >
                    Expiradas
                </button>
                <button
                    className={`py-2 px-4 ${activeTab === 'Fechada' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('Fechada')}
                >
                    Fechada
                </button>
                <button
                    className={`py-2 px-4 ${activeTab === 'minhas' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('minhas')}
                >
                    Minhas Cotações
                </button>
            </div>

            {/* Cotacoes List */}
            <div>
                {filteredCotacoes().length > 0 ? (
                    <div className="space-y-4">
                        {filteredCotacoes().map(cotacao => {
                            const expired = isExpired(cotacao.datalimite);
                            return renderCotacao(cotacao, expired);
                        })}
                    </div>
                ) : (
                    <p className="text-gray-600">Nenhuma cotação disponível.</p>
                )}
            </div>

            {/* Snackbar */}
            {snackbarOpen && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-lg shadow-md">
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
};

export default Cotacoes;
