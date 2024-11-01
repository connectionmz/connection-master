import React, { useState } from 'react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, ref, push, set } from 'firebase/database';

const PublishPhoto = ({ userId, onSave }) => {
  const [photos, setPhotos] = useState([]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
  };

  const handleUpload = () => {
    const storage = getStorage();
    photos.forEach(photo => {
      const fileRef = storageRef(storage, `published/${userId}/${photo.file.name}`);
      uploadBytes(fileRef, photo.file).then(() => {
        getDownloadURL(fileRef).then((url) => {
          const newPhotoRef = push(ref(database, `company/${userId}/publishedPhotos`));
          set(newPhotoRef, url).then(() => {
            onSave(url);
          });
        }).catch((error) => {
          console.error('Error getting photo URL: ', error);
        });
      }).catch((error) => {
        console.error('Error uploading photo: ', error);
      });
    });
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange} 
        multiple 
        accept="image/*"
      />
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {photos.map((photo, index) => (
          <div key={index} style={{ margin: '10px', position: 'relative' }}>
            <img 
              src={photo.url} 
              alt={`preview ${index}`} 
              style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
            />
          </div>
        ))}
      </div>
      <button onClick={handleUpload} className='btn btn-success'>Upload Fotos</button>
    </div>
  );
};

export default PublishPhoto;
