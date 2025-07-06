import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostGallery = ({ posts, onDelete, onEdit }) => {
  const [selectedPost, setSelectedPost] = useState(null); // Selected post for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [editedCaption, setEditedCaption] = useState(''); // State for editing caption
  const navigate = useNavigate();  

  // Open the modal with the selected post
  const openModal = (post) => {
    setSelectedPost(post);
    setEditedCaption(post.description); // Initialize caption with current description
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Handle the delete action
  const handleDelete = () => {
    if (selectedPost) {
      onDelete(selectedPost); // Call the delete function passed as a prop
      closeModal(); // Close the modal after deletion
    }
  };
  const randomSpan = () => Math.random() > 0.7 ? 'row-span-2 col-span-2' : 'row-span-1 col-span-1';

  const handleClick = (postId) => {
    navigate(`/post/${postId}`);  
  };

  // Handle the save caption action
  const handleSaveCaption = () => {
    if (selectedPost) {
      onEdit(selectedPost, editedCaption); // Call the edit function passed as a prop
      closeModal(); // Close the modal after saving
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    if (isToday) {
      return `As ${formattedTime}`;
    } else {
      return date.toLocaleDateString('pt-BR') + '  ' + formattedTime;
    }
  };

  return (
    <div>
      {/* Gallery */}
      <div className="p-2 bg-white">
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">Nenhuma publicação encontrada</p>
          </div>
        ) : (
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
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal for viewing and editing image */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg relative max-w-2xl mx-auto">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={closeModal}
            >
              &times;
            </button>

            {/* Full-size image */}
            <img
              src={selectedPost.url}
              alt="Full-size image"
              className="w-full h-auto max-h-96 object-contain"
            />

            {/* Caption edit input */}
            <div className="mt-4">
              <label className="block text-gray-700 font-medium">Editar Legenda:</label>
              <input
                type="text"
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300"
              >
                Apagar
              </button>
              <button
                onClick={handleSaveCaption}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostGallery;