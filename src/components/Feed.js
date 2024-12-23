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
              company: company.nome,
              logoUrl: company.logoUrl || null
            }));
            allPosts = [...allPosts, ...companyPosts];

            companiesWithPosts.push({ 
              name: company.name, 
              logoUrl: company.logoUrl || 'https://via.placeholder.com/150' 
            });
          }
        });
      }
      setPosts(allPosts);
      setCompaniesWithPosts(companiesWithPosts);
      setFilteredPosts(allPosts); 
    });
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
        {filteredPosts.map((post, index) => (
          <PostCard post={post} key={index} />
        ))}
      </div>
    </div>
  );
};

export default Feed;
