const GridPosts = ({ campaign }) => {
    const posts = [
        { id: 1, imgSrc: 'https://via.placeholder.com/150', alt: 'Post 1' },
        { id: 2, imgSrc: 'https://via.placeholder.com/150', alt: 'Post 2' },
        { id: 3, imgSrc: 'https://via.placeholder.com/150', alt: 'Post 3' },
        { id: 4, imgSrc: 'https://via.placeholder.com/150', alt: 'Post 4' },
        { id: 5, imgSrc: 'https://via.placeholder.com/150', alt: 'Post 5' },
        { id: 6, imgSrc: 'https://via.placeholder.com/150', alt: 'Post 6' },
    ];

    return (
        <div className="grid grid-cols-3 gap-2 mt-4">
            {posts.map((post) => (
                <div key={post.id} className="bg-gray-200 rounded-lg overflow-hidden">
                    <img
                        src={post.imgSrc}
                        alt={post.alt}
                        className="object-cover h-32 w-full"
                    />
                </div>
            ))}
        </div>
    );
}

export default GridPosts;
