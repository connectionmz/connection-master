import React, { useEffect, useState } from 'react';
import { VerifiedRounded, MoreHoriz, Twitter, Instagram, LinkedIn, Logout, Edit, CameraAlt, Language, Store, RequestQuote, Message, Phone } from "@mui/icons-material";
import { useNavigate, useParams } from 'react-router-dom';
import { get, ref, update, push } from 'firebase/database'; 
import { auth, db } from '../fb'; 
import PostGallery from './PostGallery';

const CompanyProfile = ({ user }) => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('inicio');
    const [userData, setUserData] = useState(null);
    const [mCompany, setmCompany] = useState(null);
    const [social, setSocial] = useState({ twitter: '', linkedin: '', instagram: '', website: '' });
    const [loading, setLoading] = useState(true);
    const [cotacoes, setCotacoes] = useState([]);
    const [modules, setModules] = useState({});
    const [smsLimit, setSmsLimit] = useState(0); 
    const userId = id;
    const [posts, setPosts] = useState([]);
    const [visits, setVisits] = useState([]);

    useEffect(() => {
        if (userId) {
            const fetchData = async () => {
                try {
                    const companyRef = ref(db, `company/${userId}`);
                    const socialRef = ref(db, `company/${userId}/social`);
                    const postsRef = ref(db, `company/${userId}/publishedPhotos`);
                    const cotacoesRef = ref(db, `cotacoes`);
                    const visitasRef = ref(db, `company/${userId}/visitas`);

                    const [companySnapshot, socialSnapshot, cotacoesSnapshot, postsSnapshot, visitasSnapshot] = await Promise.all([
                        get(companyRef),
                        get(socialRef),
                        get(cotacoesRef),
                        get(postsRef),
                        get(visitasRef)
                    ]);

                    if (companySnapshot.exists()) {
                        const companyData = companySnapshot.val();
                        setmCompany(companyData);
                        setUserData({
                            ...companyData,
                            photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
                            coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
                            displayName: companyData.nome || 'A carregar',
                            username: companyData.id || 'A carregar',
                            endereco: companyData.endereco || 'A carregar'
                        });

                        setModules(companyData.activeModules || {});
                        setSmsLimit(companyData.activeModules?.moduloSMS?.limit || 0);
                        
                        const newVisitRef = push(visitasRef);
                        await update(newVisitRef, {
                            visitorId: user.id, 
                            visitorName: user.nome || 'Visitante Anônimo', 
                            timestamp: new Date().toISOString()
                        });
                    }

                    if (socialSnapshot.exists()) {
                        setSocial(socialSnapshot.val());
                    }
                    if (postsSnapshot.exists()) {
                        const posts = Object.values(postsSnapshot.val() || []);
                        setPosts(posts);
                    }
                    if (cotacoesSnapshot.exists()) {
                        const cotacoesData = cotacoesSnapshot.val();
                        const userCotacoes = Object.keys(cotacoesData).filter(key => 
                            cotacoesData[key].company && cotacoesData[key].company.id === userId
                        );
                        setCotacoes(userCotacoes.map(key => cotacoesData[key]));
                    }
                    if (visitasSnapshot.exists()) {
                        setVisits(Object.values(visitasSnapshot.val()));
                    }

                } catch (error) {
                    console.error('Error fetching data: ', error);
                    navigate('/auth');
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        } else {
            navigate('/auth');
        }
    }, [userId, navigate, user]);

    const handleCotacaoClick = (id, companyId) => {
        console.log(id);
        console.log(companyId);
    };
    
    if (loading) {
        return <div>Carregando...</div>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'inicio':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 p-4">
                        <div>
                            {userData?.missaoVisaoValores ? (
                                <div dangerouslySetInnerHTML={{ __html: userData.missaoVisaoValores }} />
                            ) : (
                                <p>Não informada</p>
                            )}
                        </div>
                    </div>
                );
            case 'Publicados':
                return <PostGallery posts={posts} />;
            case 'liked':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        {cotacoes.length > 0 ? (
                            <div className="space-y-4">
                                {cotacoes.map((cotacao) => (
                                    <div 
                                        key={cotacao.id} 
                                        className="p-4 border rounded-lg bg-white shadow-md cursor-pointer"
                                        onClick={() => handleCotacaoClick(cotacao.id, cotacao.company.id)}
                                    >
                                        <h3 className="text-md font-bold mb-2">{cotacao.title}</h3>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">Nenhuma cotação publicada.</p>
                        )}
                    </div>
                );
            case 'sobre':
                return (
                    <div className="p-4">
                        <ul className="text-gray-600 space-y-2">
                            <li><strong>Endereço:</strong> {mCompany?.endereco || 'Não informado'}</li>
                            <li><strong>Província:</strong> {mCompany?.provincia || 'Não informado'}</li>
                            <li><strong>Sector:</strong> {mCompany?.sector || 'Não informado'}</li>
                            <li><strong>Tipo de Entidade:</strong> {mCompany?.tipoEntidade || 'Não informado'}</li>
                        </ul>
                    </div>
                );
            default:
                return <div className="text-center text-gray-500 mt-6">Nenhum conteúdo disponível.</div>;
        }
    };
    return (
        <div className="bg-white min-h-screen">
            <div className="relative">
                <div className="relative h-48 bg-gray-200">
                    <img src={userData?.coverPhotoURL} alt="Cover" className="object-cover w-full h-full" />
                </div>
                <div className="absolute top-32 left-4">
                    <img src={userData?.photoURL} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white object-cover" />
                </div>
            </div>
            <div className="mt-16 text-center">
                <h1 className="text-2xl font-bold">{userData?.displayName}</h1>
                <div className="max-w-2xl mx-auto mt-4">
                    <p className="text-gray-600">{userData?.bio}</p>
                </div>  
                <div className="flex justify-center mt-6 space-x-4">
                <div className="flex space-x-4 mt-4">
    {/* Botão para Navegar para a Loja */}
    <button
        onClick={() => navigate(`/stores/${userId}`)}
        className="flex flex-col items-center text-gray-600 hover:text-green-500"
        title="Ir para a Loja"
    >
        <Store className="text-green-500" />
        <span className="text-xs mt-1">Loja</span>
    </button>

    {/* Botão para Navegar para RFQ */}
    <button
        onClick={() => navigate(`/rfq/${userId}`)}
        className="flex flex-col items-center text-gray-600 hover:text-green-500"
        title="Solicitação de Cotação"
    >
        <RequestQuote className="text-green-500" />
        <span className="text-xs mt-1">Cotações</span>
    </button>
</div>

    <p>
    {userData.contacto && (
                        <a href={`tel:${userData.contacto}`} className="text-gray-600">
                            <Phone className="text-green-500" />
                            <span className="text-xs mt-1">Ligar</span>

                        </a>
                    )}
                    {social.twitter && (
                        <a href={social.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="text-blue-500" />
                        </a>
                    )}
                    {social.linkedin && (
                        <a href={social.linkedin} target="_blank" rel="noopener noreferrer">
                            <LinkedIn className="text-blue-700" />
                        </a>
                    )}
                    {social.instagram && (
                        <a href={social.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="text-pink-500" />
                        </a>
                    )}
    </p>
                </div>
            </div>
            <div className="flex justify-center mt-8 space-x-6 border-b-2 border-gray-200 pb-4">
    <button 
        onClick={() => setActiveTab('inicio')} 
        className={`px-4 py-2 font-medium ${activeTab === 'inicio' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
    >
        Início
    </button>
    <button 
        onClick={() => setActiveTab('sobre')} 
        className={`px-4 py-2 font-medium ${activeTab === 'sobre' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
    >
        Sobre
    </button>
    <button 
        onClick={() => setActiveTab('Publicados')} 
        className={`px-4 py-2 font-medium ${activeTab === 'Publicados' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
    >
        Publicações
    </button>
    <button 
        onClick={() => setActiveTab('liked')} 
        className={`px-4 py-2 font-medium ${activeTab === 'liked' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
    >
        Cotações
    </button>
</div>

            <div className="p-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default CompanyProfile;
