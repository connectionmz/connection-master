import React, { useState } from 'react';
import { ThumbUp, ChatBubbleOutline, Share } from '@mui/icons-material';

const PostCardDesk = ({ post }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href + `/post/${post.id}`);
    alert('Link do post copiado para a área de transferência!');
  };

  const randomSpan = () =>
    Math.random() > 0.7 ? 'row-span-2 col-span-2' : 'row-span-1 col-span-1';

  return (
    <div
      className={`relative group overflow-hidden rounded-lg cursor-pointer ${randomSpan()}`}
    >
      <img
        src={post.url}
        alt={`Post ${post.id}`}
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
      />
      {/* Descrição do post (overlay ao passar o mouse) */}
      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-center px-2 text-sm mb-2">
          {post.description || 'Sem descrição'}
        </p>
      </div>

      {/* Informações da empresa */}
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

      {/* Ações (Gostar, Comentar, Partilhar) */}
      <div className="absolute top-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs flex gap-3 items-center">
        {/* Botão Gostar */}
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={handleLike}
        >
          <ThumbUp
            fontSize="small"
            className={liked ? 'text-blue-500' : 'text-white'}
          />
          <span>{likes}</span>
        </div>

        {/* Botão Comentar */}
        <div className="flex items-center gap-1 cursor-pointer">
          <ChatBubbleOutline fontSize="small" />
          <span>{post.comments?.length || 0}</span>
        </div>

        {/* Botão Partilhar */}
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={handleShare}
        >
          <Share fontSize="small" />
        </div>
      </div>
    </div>
  );
};

export default PostCardDesk;
