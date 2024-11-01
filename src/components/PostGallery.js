import React, { useState } from 'react';

const PostGallery = ({ posts, onDelete, onEdit }) => {
  const [selectedPost, setSelectedPost] = useState(null); // Selected post for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [editedCaption, setEditedCaption] = useState(''); // State for editing caption

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

  // Handle the save caption action
  const handleSaveCaption = () => {
    if (selectedPost) {
      onEdit(selectedPost, editedCaption); // Call the edit function passed as a prop
      closeModal(); // Close the modal after saving
    }
  };

  return (
    <div>
      {/* Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div className="grid grid-cols-3 gap-4">
                        {posts.map((post, index) => (
                            <div key={index} className="relative h-40 bg-gray-200 rounded-md overflow-hidden" onClick={() => openModal(post)}>
                                <img src={post.url} alt={`Published Photo ${index + 1}`} className="object-cover h-full w-full" />
                                <div className="absolute bottom-0 left-0 w-full p-2 bg-black bg-opacity-50 text-white text-sm">
                                    {post.description || ''}
                                    </div>
                            </div>
                        ))}
                    </div>

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
