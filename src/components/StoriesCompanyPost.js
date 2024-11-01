import React from 'react';

const StoriesCompanyPost = ({ companies }) => {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto bg-gray-100 rounded-md mb-4">
      {companies.map((company, index) => (
        <div key={index} className="flex-shrink-0 w-16 h-16">
          <div className="relative rounded-full border-2 border-blue-500 p-1">
            <img 
              src={company.logoUrl || 'https://via.placeholder.com/150'} 
              alt={company.name} 
              className="rounded-full w-full h-full object-cover"
            />
          </div>
          <p className="text-xs mt-1 text-center truncate">{company.name}</p>
        </div>
      ))}
    </div>
  );
};

export default StoriesCompanyPost;
