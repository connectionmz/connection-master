import React, { useEffect, useState } from 'react';
import { Twitter, Instagram, LinkedIn, Language, Edit, EditAttributes, CameraAlt, ExitToApp } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../fb'; 
import PostGallery from './PostGallery';
import { EditorText } from '../utils/formUtils';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { AiFillSetting } from 'react-icons/ai';

const Profile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Publicados');
    const [userData, setUserData] = useState(null);
    const [social, setSocial] = useState({ twitter: '', linkedin: '', instagram: '', website: '' });
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [cotacoes, setCotacoes] = useState([]);
    const [showProfileModal, setShowProfileModal] = useState(false); 
    const [showFullText, setShowFullText] = useState(false);
    const [profileData, setProfileData] = useState({
        bio: '',
        missaoVisaoValores: '',
    });
    const [coverPhoto, setCoverPhoto] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const coverPhotoStorageRef = storageRef(storage, `company/${user}/coverPhoto/${file.name}`);
  
        await uploadBytes(coverPhotoStorageRef, file);
  
        const coverPhotoURL = await getDownloadURL(coverPhotoStorageRef);
  
        await update(ref(db, `company/${user}`), { coverUrl: coverPhotoURL });
  
        setCoverPhoto(coverPhotoURL);
  
        console.log("Foto de capa atualizada com sucesso!");
      } catch (error) {
        console.error("Erro ao fazer upload da foto de capa: ", error);
      }
    }
  };
  
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const profilePhotoStorageRef = storageRef(storage, `company/${user}/profilePhoto/${file.name}`);
  
        await uploadBytes(profilePhotoStorageRef, file);
  
        const profilePhotoURL = await getDownloadURL(profilePhotoStorageRef);
  
        await update(ref(db, `company/${user}`), { logoUrl: profilePhotoURL });
  
        setProfilePhoto(profilePhotoURL);
  
        console.log("Foto de perfil atualizada com sucesso!");
      } catch (error) {
        console.error("Erro ao fazer upload da foto de perfil: ", error);
      }
    }
  };
  
    const user = auth.currentUser?.uid;

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const companyRef = ref(db, `company/${user}`);
                    const socialRef = ref(db, `company/${user}/social`);
                    const postsRef = ref(db, `company/${user}/publishedPhotos`);
                    const cotacoesRef = ref(db, `cotacoes`);

                    const [companySnapshot, socialSnapshot, cotacoesSnapshot, postsSnapshot] = await Promise.all([
                        get(companyRef),
                        get(socialRef),
                        get(cotacoesRef),
                        get(postsRef)
                    ]);

                    if (companySnapshot.exists()) {
                        const companyData = companySnapshot.val();
                        setUserData({
                            ...companyData,
                            photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
                            coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
                            displayName: companyData.nome || 'Nome da Empresa',
                            username: companyData.id || 'ID da Empresa',
                            endereco: companyData.endereco || 'Endereço da Empresa',
                            bio: companyData.bio || '',
                        });
                       
                    } else {
                        navigate('/setup');
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
                                cotacoesData[key].company && cotacoesData[key].company.id === user
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
    }, [user, navigate]);

    const toggleShowFullText = () => setShowFullText(prevState => !prevState);

    const handleSaveProfile = async () => {
        if (user) {
            try {
                const companyUpdate = {
                    bio: profileData.bio, 
                    missaoVisaoValores: profileData.missaoVisaoValores,
                };
                await update(ref(db, `company/${user}`), companyUpdate);
                
                setUserData(prev => ({ ...prev, ...profileData }));
                setShowProfileModal(false);
            } catch (error) {
                console.error('Erro ao atualizar perfil: ', error);
            }
        }
    };

    const handleDescriptionChange = (value) => {
        setProfileData((prevData) => ({
          ...prevData,
          missaoVisaoValores: value, 
        }));
      };
    
const handleDeletePost = (postToDelete) => {
    setPosts((prevPosts) => prevPosts.filter(post => post !== postToDelete));
    console.log('Post deletado:', postToDelete);
  };

  const handleEditCaption = (postToEdit, newCaption) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post === postToEdit ? { ...post, description: newCaption } : post
      )
    );
    console.log('Legenda atualizada:', newCaption);
  };



    if (loading) return <div>Carregando...</div>;

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
                return (
                            <PostGallery posts={posts} onDelete={handleDeletePost} onEdit={handleEditCaption} />               
                );
            case 'liked':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        {cotacoes.length > 0 ? (
                            cotacoes.map((cotacao, index) => (
                                <div key={index} className="p-4 border rounded-lg shadow-md bg-white">
                                    <a href={`/detalhe-cotacao/${cotacao.id}`}>
                                        <h2 className="text-xl font-bold">{cotacao.title}</h2>
                                        <p className="text-gray-600">{cotacao.description}</p>
                                        <p className="text-gray-600"><strong>Data Limite:</strong> {new Date(cotacao.datalimite).toLocaleDateString()}</p>
                                        <div className="mt-4">
                                            {cotacao.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center mb-2">
                                                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover mr-4 rounded" />
                                                    <div><p className="font-semibold">{item.name}</p><p className="text-gray-600">{item.description}</p></div>
                                                </div>
                                            ))}
                                        </div>
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">Nenhuma cotação disponível.</p>
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
                <img src={coverPhoto || userData.coverPhotoURL} alt="Cover" className="object-cover w-full h-full" />
                <div className="absolute top-2 right-2">
                  <input
                    accept="image/*"
                    type="file"
                    id="coverPhotoInput"
                    style={{ display: 'none' }}
                    onChange={handleCoverPhotoChange}
                  />
                  <button
                    color="primary"
                    aria-label="edit cover photo"
                    onClick={() => document.getElementById('coverPhotoInput').click()}>
                    <CameraAlt />
                  </button>
                </div>
              </div>

              <div className="absolute top-32 left-4">
                <img
                  src={profilePhoto || userData.photoURL}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover"
                />
                <div className="absolute -bottom-2 right-0">
                  <input
                    accept="image/*"
                    type="file"
                    id="profilePhotoInput"
                    style={{ display: 'none' }}
                    onChange={handleProfilePhotoChange}
                  />
                  <button
                    color="primary"
                    aria-label="edit profile photo"
                    onClick={() => document.getElementById('profilePhotoInput').click()}
                  >
                    <CameraAlt />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-16 text-center">
      <h1 className="text-2xl font-bold">{userData?.displayName}</h1>

      <div className="max-w-2xl mx-auto mt-4">
        {userData?.bio || 'Sem Bio' && userData.bio.length > 120 && (
          <button 
            onClick={toggleShowFullText} 
            className="text-blue-500 hover:underline mt-2"
          >
            {showFullText ? 'Ver Menos' : 'Ver Mais'}
          </button>
        )}
      </div>
    
      <a href='editar-perfil' aria-label="Editar Perfil">
        <AiFillSetting className="text-2xl inline-block ml-4" />
      </a>
      <div className="flex justify-center mt-6 space-x-4">
        {social?.linkedin && (
          <a href={social.linkedin} aria-label="LinkedIn">
            <LinkedIn className="text-blue-700" />
          </a>
        )}
        {social?.instagram && (
          <a href={social.instagram} aria-label="Instagram">
            <Instagram className="text-pink-500" />
          </a>
        )}
        {social?.website && (
          <a href={social.website} aria-label="Website">
            <Language className="text-gray-600" />
          </a>
        )}
      </div>
    </div>
            {/* Scrollable Tabs */}
            <div className="overflow-x-auto mt-8 border-b border-gray-200">
                <div className="flex justify-center space-x-4">
                    <button onClick={() => setActiveTab('inicio')} className={`py-2 px-6 ${activeTab === 'inicio' ? 'border-b-2 border-blue-500' : ''}`}>Início</button>
                    <button onClick={() => setActiveTab('Publicados')} className={`py-2 px-6 ${activeTab === 'Publicados' ? 'border-b-2 border-blue-500' : ''}`}>Publicados</button>
                    <button onClick={() => setActiveTab('liked')} className={`py-2 px-6 ${activeTab === 'liked' ? 'border-b-2 border-blue-500' : ''}`}>Cotações</button>
                </div>
            </div>
            
            <div className="mt-6 p-4">{renderContent()}</div>
           
        </div>
    );
};

export default Profile;