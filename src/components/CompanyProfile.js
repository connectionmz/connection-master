import React, { useEffect, useState } from 'react';
import { VerifiedRounded, MoreHoriz, Twitter, Instagram, LinkedIn, Logout, Edit, CameraAlt, Language, Store, RequestQuote, Message } from "@mui/icons-material";
import { useNavigate, useParams } from 'react-router-dom';
import { get, ref, update, push } from 'firebase/database'; 
import { auth, db } from '../fb'; 
import PostGallery from './PostGallery';

const CompanyProfile = ({user}) => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('inicio');
    const [userData, setUserData] = useState(null);
    const [mCompany, setmCompany] = useState(null);
    const [social, setSocial] = useState({ twitter: '', linkedin: '', instagram: '', website: '' });
    const [loading, setLoading] = useState(true);
    const [cotacoes, setCotacoes] = useState([]);
    const [hasProModule, setHasProModule] = useState(false); 
    const [hasFaturacaoModule, setHasFaturacaoModule] = useState(false); 
    const [smsLimit, setSmsLimit] = useState(0); 
    const userId = id;
    const [posts, setPosts] = useState([]);

    useEffect(() => {

        console.log(user)
        if (userId) {
            const fetchData = async () => {
                try {
                    const companyRef = ref(db, `company/${userId}`);
                    const socialRef = ref(db, `company/${userId}/social`);
                    const postsRef = ref(db, `company/${userId}/publishedPhotos`);
                    const cotacoesRef = ref(db, `cotacoes`);

                    const [companySnapshot, socialSnapshot, cotacoesSnapshot, postsSnapshot] = await Promise.all([
                        get(companyRef),
                        get(socialRef),
                        get(cotacoesRef),
                        get(postsRef)
                    ]);

                    if (companySnapshot.exists()) {
                        const companyData = companySnapshot.val();
                        setmCompany(companyData);
                        setUserData({
                            ...companyData,
                            photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
                            coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
                            displayName: companyData.nome || 'Nome da Empresa',
                            username: companyData.id || 'ID da Empresa',
                            endereco: companyData.endereco || 'Endereço da Empresa'
                        });

                        setHasProModule(companyData.activeModules?.moduloMarket?.limit === "ilimitado");
                        setHasFaturacaoModule(companyData.activeModules?.moduloFaturacao?.limit === "ilimitado");
                        setSmsLimit(companyData.activeModules?.moduloSMS?.limit || 0);
                        
                        const visitasRef = ref(db, `company/${userId}/visitas`);
                        const newVisitRef = push(visitasRef);
                        const visitorId = user.id; 
                        const visitorName = user.nome || 'Visitante Anônimo'; 
                        const timestamp = new Date().toISOString(); 
                        await update(newVisitRef, {
                            visitorId,
                            visitorName,
                            timestamp
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
                        if (cotacoesData) {
                            const userCotacoes = Object.keys(cotacoesData).filter(key => 
                                cotacoesData[key].company && cotacoesData[key].company.id === userId
                            );
                            setCotacoes(userCotacoes.map(key => cotacoesData[key]));
                        }
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
    }, [userId, navigate]);

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
                    {hasProModule && (
                        <button onClick={() => navigate(`/stores/${userId}`)}>
                            <Store className="text-green-500" />
                        </button>
                    )}
                    {hasFaturacaoModule && (
                        <button onClick={() => navigate(`/rfq/${userId}`)}>
                            <RequestQuote className="text-blue-500" />
                        </button>
                    )}                   
                    {social.twitter && <a href={social.twitter}><Twitter className="text-blue-500" /></a>}
                    {social.linkedin && <a href={social.linkedin}><LinkedIn className="text-blue-700" /></a>}
                    {social.instagram && <a href={social.instagram}><Instagram className="text-pink-500" /></a>}
                    {social.website && <a href={social.website}><Language className="text-gray-600" /></a>}
                </div>
            </div>
            <div className="overflow-x-auto mt-8 border-b border-gray-200">
                <div className="flex justify-center space-x-4">
                    <button onClick={() => setActiveTab('inicio')} className={`py-2 px-6 ${activeTab === 'inicio' ? 'text-blue-600 border-blue-600' : 'text-gray-600'} border-b-2`}>
                        Início
                    </button>
                    <button onClick={() => setActiveTab('Publicados')} className={`py-2 px-6 ${activeTab === 'Publicados' ? 'text-blue-600 border-blue-600' : 'text-gray-600'} border-b-2`}>
                        Publicações
                    </button>
                    <button onClick={() => setActiveTab('liked')} className={`py-2 px-6 ${activeTab === 'liked' ? 'text-blue-600 border-blue-600' : 'text-gray-600'} border-b-2`}>
                        Cotações
                    </button>
                </div>
            </div>
            <div className="mt-8 max-w-5xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default CompanyProfile;
