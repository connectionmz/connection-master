import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb'; 
import { useNavigate } from 'react-router-dom';

const FeedDesk = () => {
  const navigate = useNavigate();  

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const postsRef = ref(db, 'posts');

    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const allPosts = [];

      if (data) {
        Object.entries(data).forEach(([postId, post]) => {
          allPosts.push({
            id: postId,
            description: post.description || '',
            url: post.url || '',
            companyName: post.company.name || 'Empresa Desconhecida',
            logoUrl: post.company.logo || 'https://via.placeholder.com/150',
          });
        });
      }

      setPosts(allPosts); 
    });
  }, []);

  const randomSpan = () => Math.random() > 0.7 ? 'row-span-2 col-span-2' : 'row-span-1 col-span-1';

  const handleClick = (postId) => {
    navigate(`/post/${postId}`);  
  };

  return (
    <div className="p-2 bg-white">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
        {posts.map((post) => (
          <div 
            key={post.id}
            className={`relative group overflow-hidden rounded-lg cursor-pointer ${randomSpan()}`} 
            onClick={() => handleClick(post.id)}  
          >
            <img 
              src={post.url} 
              alt={`Post ${post.id}`} 
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p
  className="text-center px-2 text-sm mb-2"
  dangerouslySetInnerHTML={{ __html: post.description || 'Sem descrição' }}
></p>

            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={post.logoUrl || 'https://via.placeholder.com/32'} 
                  alt={post.companyName} 
                  className="w-6 h-6 object-cover rounded-full mr-2"
                />
                <span>{post.companyName || 'Empresa desconhecida'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedDesk;
