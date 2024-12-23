import React from 'react';

const PostCard = ({ post }) => {
  const randomSpan = () => Math.random() > 0.7 ? 'row-span-2 col-span-2' : 'row-span-1 col-span-1';

  return (
    <div 
      className={`relative group overflow-hidden rounded-lg cursor-pointer ${randomSpan()}`} >
      <img 
        src={post.url} 
        alt={`Post ${post.id}`} 
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"/>
      
      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-center px-2 text-sm mb-2">{post.description || 'Sem descrição'}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={post.logoUrl || 'https://via.placeholder.com/32'} 
            alt={post.company} 
            className="w-6 h-6 object-cover rounded-full mr-2"
          />
          <span>{post.company || 'Empresa desconhecida'}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
