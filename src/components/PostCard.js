import React from 'react';

const PostCard = ({ post, onClick }) => {
  return (
    <div 
      className="relative group overflow-hidden rounded-lg cursor-pointer" 
      onClick={onClick}
    >
      <img 
        src={post.url} 
        alt={`Post ${post.id}`} 
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-center px-2 text-sm">{post.description}</p>
      </div>
    </div>
  );
};

export default PostCard;
