import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb'; 
import PostCard from './PostCard';
import StoriesCompanyPost from './StoriesCompanyPost';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]); 
  const [companiesWithPosts, setCompaniesWithPosts] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    // Os posts vivem no node raiz `posts/`, não em company/{id}/publishedPhotos.
    // Cada post já traz o objeto `company` embutido (nome, logoUrl, id, etc).
    const postsRef = ref(db, 'posts');

    const unsubscribe = onValue(postsRef, (snapshot) => {
      const postsData = snapshot.val();
      const allPosts = [];
      const companiesMap = {};

      if (postsData) {
        Object.entries(postsData).forEach(([postId, post]) => {
          // Schema real do sub-objeto `company` dentro de cada post:
          // { id, logo, name, provincia, sector }
          const company = post.company || {};
          const companyName = company.name || 'Empresa';
          const companyLogo = company.logo || null;

          allPosts.push({
            ...post,
            id: post.id || postId,
            // Sobrescreve `company` (que na origem é um objeto) por uma
            // string — é isto que o PostCard espera renderizar como texto.
            company: companyName,
            companyId: company.id || null,
            logoUrl: companyLogo,
          });

          // Dedup por id da empresa (ou nome, se id não existir)
          const companyKey = company.id || companyName;
          if (companyKey && !companiesMap[companyKey]) {
            companiesMap[companyKey] = {
              name: companyName,
              logoUrl: companyLogo || 'https://via.placeholder.com/150',
            };
          }
        });
      }

      // Mais recentes primeiro, quando houver timestamp
      allPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setPosts(allPosts);
      setCompaniesWithPosts(Object.values(companiesMap));
      setFilteredPosts(allPosts);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectCompany = (companyName) => {
    const companyPosts = posts.filter(post => post.company === companyName);
    setFilteredPosts(companyPosts);
    setSelectedCompany(companyName);
  };

  const handleShowAllPosts = () => {
    setFilteredPosts(posts);
    setSelectedCompany(null);
  };

  return (
    <div className="p-2 bg-white">
      {companiesWithPosts.length > 0 && (
        <StoriesCompanyPost companies={companiesWithPosts} onSelectCompany={handleSelectCompany} />
      )}
      {selectedCompany && (
        <button 
          className="mb-4 bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600" 
          onClick={handleShowAllPosts}>Ver todas as publicações</button>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
        {filteredPosts.map((post) => (
          <PostCard post={post} key={post.id} />
        ))}
      </div>
    </div>
  );
};

export default Feed;