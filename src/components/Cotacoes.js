import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../fb'; 
import { onAuthStateChanged } from 'firebase/auth';
import PaySMSCheckout from './PaySMSCheckout';


const Cotacoes = ({ user, onModuleActivation }) => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [loggedInUser, setLoggedInUser] = useState(null); 
    const [snackbarMessage, setSnackbarMessage] = useState(''); 
    const [snackbarOpen, setSnackbarOpen] = useState(false); 
    const [isPaying, setIsPaying] = useState(false); 
    const navigate = useNavigate();

    const hasModuleSMS = user?.activeModules?.moduloSMS?.status === 'active';

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setLoggedInUser(user); 
            } else {
                setLoggedInUser(null); 
            }
        });

        return () => {
            unsubscribeAuth();
        };
    }, []);

    useEffect(() => {
        if (!hasModuleSMS) return;

        const cotacoesRef = ref(db, 'cotacoes');
    
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val() || {};
            const cotacoesList = Object.entries(cotacoesData)
                .map(([id, data]) => ({
                    id,
                    ...data
                }))
                .filter(cotacao => 
                    cotacao.sector === user.sector && 
                    cotacao.company?.provincia === user.provincia
                ); 
    
            setCotacoes(cotacoesList);
        });
    
        return () => {
            unsubscribeCotacoes();
        };
    }, [db, user, hasModuleSMS]);
    
    const handlePublishQuotation = () => {
        if (!hasModuleSMS) {
            alert('Você precisa ativar o módulo SMS para emitir cotações.');
            return;
        }
        navigate('/publicar-cotacao');
    };

    const deleteCotacao = (cotacaoId) => {
        if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
            const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
            remove(cotacaoRef)
                .then(() => {
                    setSnackbarMessage('Cotação excluída com sucesso!');
                    setSnackbarOpen(true);
                    setTimeout(() => setSnackbarOpen(false), 3000);
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
            className={`p-6 border rounded-xl bg-white shadow-lg transform hover:scale-105 transition-transform duration-200 cursor-pointer ${
                expired ? 'bg-gray-100 opacity-70' : ''}`}
            onClick={() => handleCotacaoClick(cotacao.id, cotacao.company.id)}
            title={expired ? 'Cotação expirada' : ''}>
            <div className="flex items-center mb-4">
                <img 
                    src={cotacao.company?.logoUrl || 'https://via.placeholder.com/64'} 
                    alt={cotacao.company?.nome || 'Empresa Desconhecida'} 
                    className="w-16 h-16 object-cover rounded-full border mr-4"
                />
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {cotacao.company?.nome || 'Empresa Desconhecida'}
                    </h2>
                    <p className="text-sm text-gray-500">
                    {expired ? 'Expirada' : 'Ativa'}
                    </p>
                </div>
            </div>
            <h3 className="text-lg font-bold text-blue-600 truncate mb-3">
                {cotacao?.title}
            </h3>
            <h5 className="text-lg font-bold ttruncate mb-3">
                Sector: {cotacao?.sector}
            </h5>
            <p className="text-sm text-gray-500 mb-2">
                Publicada em: <span className="font-medium">{new Date(cotacao?.timestamp).toLocaleDateString()}</span>
            </p>
            <p className={`text-sm font-semibold mb-4 ${
                expired ? 'text-red-500' : 'text-gray-800'
            }`}>
                {expired ? 'Cotação Expirada' : `Data Limite: ${new Date(cotacao.datalimite).toLocaleDateString()}`}
            </p>
            <div className="space-y-2">
                {(cotacao.items || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-12 items-center gap-4 mb-2">
                        <img 
                            src={item.imageUrl || 'https://via.placeholder.com/64'} 
                            alt={item.name} 
                            className="col-span-3 w-full h-16 object-cover rounded border"
                        />
                        <div className="col-span-9">
                            <h4 className="text-sm font-medium text-gray-800 truncate">
                                {item.name}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {loggedInUser?.uid === cotacao?.company?.id && (
                <div className="flex justify-end mt-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); 
                            deleteCotacao(cotacao?.id);
                        }}
                        className="text-sm text-red-500 hover:text-red-600 font-semibold">
                        Excluir Cotação
                    </button>
                </div>
            )}
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

    const handlePaymentSuccess = (paymentDetails) => {
        const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
        update(userRef, { status: 'active', activatedAt: new Date().toISOString(), paymentDetails })
            .then(() => {
                alert('Módulo SMS ativado com sucesso!');
                if (onModuleActivation) onModuleActivation(); 

                window.location.reload();
  
            })
            .catch((error) => {
                console.error('Erro ao ativar o módulo SMS: ', error);
            });
    };

    return (
        <div className="p-4">
            {!hasModuleSMS && !isPaying && (
                <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                    <p>
                        O módulo <strong>SMS</strong> está inativo. Para usar este serviço, ative o módulo SMS.
                    </p>
                    <button 
                        className="mt-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                        onClick={() => setIsPaying(true)}>
                        Ativar Módulo SMS
                    </button>
                </div>
            )}

            {isPaying && (
                <PaySMSCheckout 
                    user={user} 
                    onPaymentSuccess={handlePaymentSuccess} 
                />
            )}

            {!isPaying && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-semibold">Cotações</h1>
                        <button 
                            className={`py-2 px-4 rounded ${
                                hasModuleSMS ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            }`}
                            onClick={handlePublishQuotation}
                            disabled={!hasModuleSMS}
                        >
                            Emitir
                        </button>
                    </div>

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
                            Minhas 
                        </button>
                    </div>
                    <div>
                    {filteredCotacoes().length > 0 ? (
    <div className="space-y-6">
        {filteredCotacoes().map(cotacao => {
            const expired = isExpired(cotacao.datalimite);
            return (
                <div 
                    key={cotacao.id} 
                    className={`p-6 border rounded-lg shadow-lg bg-white cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 ${
                        expired ? 'bg-gray-100 text-gray-500' : 'bg-white hover:shadow-xl'}`}
                    onClick={() => handleCotacaoClick(cotacao.id, cotacao.company?.id)}
                >
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">{cotacao?.titulo}</h3>
                    <p className="text-sm text-gray-600 mb-4">Prazo de Propostas: {new Date(cotacao.datalimite).toLocaleDateString()}</p>
                    <div className="flex items-center mb-5">
                        <img 
                            src={cotacao.company?.logoUrl || 'https://via.placeholder.com/64'} 
                            alt={cotacao.company?.nome || 'Empresa Desconhecida'} 
                            className="w-16 h-16 object-cover rounded-full mr-5" 
                        />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{cotacao.company?.nome || 'Empresa Desconhecida'}</h2>
                        </div>
                    </div>

                    {/* Exibir setor e botão de exclusão apenas para o usuário logado */}
                    {loggedInUser?.uid === cotacao?.company?.id && (
                        <div className="mt-4 flex items-center space-x-4">
                            <span className="text-sm text-gray-700">Setor: {cotacao.sector}</span>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Impede o clique no card
                                    deleteCotacao(cotacao?.id);
                                }} 
                                className="text-red-600 hover:text-red-700 hover:underline text-sm font-medium"
                            >
                                Excluir
                            </button>
                        </div>
                    )}
                </div>
            );
        })}
    </div>
) : (
    <p className="text-center text-gray-600 text-lg">Nenhuma cotação disponível.</p>
)}

                    </div>
                    {snackbarOpen && (
                        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-lg shadow-md">
                            {snackbarMessage}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Cotacoes;
