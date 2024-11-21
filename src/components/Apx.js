import React, { useState, useEffect } from 'react'
import { FaUserFriends, FaClock, FaBookmark, FaVideo, FaStore } from 'react-icons/fa'
import { AiFillSetting } from 'react-icons/ai'
import { BsSearch } from 'react-icons/bs'
import { ref, get, update } from "firebase/database"
import { useNavigate, Link } from 'react-router-dom'
import { auth, db } from '../fb'
import { onAuthStateChanged, signOut } from "firebase/auth"
import ModuleGrid from './ModuleGrid'
import PostInput from './PostInput'
import { CameraAlt, ExitToApp } from '@mui/icons-material'


const Apx = () => {
  const [userData, setUserData] = useState({}); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const companyRef = ref(db, `company/${user.uid}`);
          const companySnapshot = await get(companyRef);
          if (companySnapshot.exists()) {
            const companyData = companySnapshot.val();
            setUserData({
              ...companyData,
              activeModules: companyData.activeModules || []
            });
          } else {
            navigate('/setup'); 
          }
        } catch (error) {
          console.error('Error fetching data: ', error);
          navigate('/auth');
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/auth');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

 

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/auth')).catch((error) => console.error("Logout Error: ", error));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 text-black">
      <div 
        className="w-full px-6 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out shadow-lg cursor-pointer flex items-center justify-center"
        onClick={() => window.location.href = '/post'} >
        <CameraAlt className="w-6 h-6 mr-2" />
        Fazer Publicação
      </div>
      
      <Link to='/profile' className="flex items-center gap-2 my-4">
        <img
          src={userData.logoUrl}
          alt="User"
          className="rounded-full w-10 h-10 border border-gray-300"/>
        <div>
          <p className="font-bold">{userData.nome}</p>
          <p className="text-sm text-gray-600"><small>{userData.sector}</small></p>
        </div>
      </Link>
      
      <ModuleGrid activeModules={userData.activeModules || []} />



      <div 
        className="w-full logout-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        onClick={handleLogout}>
        Desconectar
        <ExitToApp />
      </div>
    </div>
  );
};

export default Apx;
