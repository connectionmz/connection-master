import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb'; 
import PostCard from './PostCard';
import PostDetailModal from './PostDetailModal';
import StoriesCompanyPost from './StoriesCompanyPost';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]); // Para filtrar posts
  const [companiesWithPosts, setCompaniesWithPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null); // Para rastrear a empresa selecionada

  useEffect(() => {
    const companiesRef = ref(db, 'company');

    onValue(companiesRef, (snapshot) => {
      const companiesData = snapshot.val();
      let allPosts = [];
      let companiesWithPosts = [];

      if (companiesData) {
        Object.values(companiesData).forEach(company => {
          if (company.publishedPhotos) {
            const companyPosts = Object.values(company.publishedPhotos).map(post => ({
              ...post,
              company: company.name,
              logoUrl: company.logoUrl || null  // Supondo que as empresas têm URL de logo
            }));
            allPosts = [...allPosts, ...companyPosts];

            // Adiciona a empresa à lista de empresas com publicações
            companiesWithPosts.push({ 
              name: company.name, 
              logoUrl: company.logoUrl || 'https://via.placeholder.com/150' 
            });
          }
        });
      }
      setPosts(allPosts);
      setCompaniesWithPosts(companiesWithPosts);
      setFilteredPosts(allPosts); // Inicialmente, mostrar todos os posts
    });
  }, []);

  // Função para exibir posts de uma empresa específica
  const handleSelectCompany = (companyName) => {
    const companyPosts = posts.filter(post => post.company === companyName);
    setFilteredPosts(companyPosts);
    setSelectedCompany(companyName);
  };

  // Função para exibir todos os posts
  const handleShowAllPosts = () => {
    setFilteredPosts(posts);
    setSelectedCompany(null);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  return (
    <div className="p-2 bg-white">
      {/* Exibir as histórias no topo */}
      {companiesWithPosts.length > 0 && (
        <StoriesCompanyPost companies={companiesWithPosts} onSelectCompany={handleSelectCompany} />
      )}

      {/* Botão para mostrar todos os posts novamente */}
      {selectedCompany && (
        <button 
          className="mb-4 bg-blue-500 text-white py-1 px-4 rounded" 
          onClick={handleShowAllPosts}
        >
          Ver todas as publicações
        </button>
      )}

      {/* Exibir o feed de posts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
        {filteredPosts.map((post, index) => (
          <PostCard post={post} key={index} onClick={() => handlePostClick(post)} />
        ))}
      </div>

      {/* Modal de detalhes do post */}
      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
};

export default Feed;
