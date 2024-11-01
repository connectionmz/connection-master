const PostDetailModal = ({ post, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">
          <h2>{post.description}</h2>
          <img src={post.url} alt={`Post ${post.id}`} className="w-full" />
          <div>
          </div>
          <button onClick={onClose} className="mt-4">Close</button>
        </div>
      </div>
    );
  };
  export default PostDetailModal