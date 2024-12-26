import React, { useState, useEffect } from 'react';
import { ref, get, update } from "firebase/database";
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../fb';
import { onAuthStateChanged, signOut } from "firebase/auth";
import ModuleGrid from './ModuleGrid';
import { CameraAlt, ExitToApp } from '@mui/icons-material';

const Apx = ({ user }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [provincia, setProvince] = useState(user.provincia || '');
  const [editProvince, setEditProvince] = useState(false);

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


  const saveProvince = async (newProvince) => {
    try {
      const companyRef = ref(db, `company/${user.id}`);
      await update(companyRef, { provincia: newProvince });
      console.log("Província salva com sucesso!"); 
      setEditProvince(false);
    } catch (error) {
      console.error("Erro ao salvar província: ", error);
    }
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
        onClick={() => window.location.href = '/post'}>
        <CameraAlt className="w-6 h-6 mr-2" />
        Fazer Publicação
      </div>

      <Link to='/profile' className="flex items-center gap-2 my-4">
        <img
          src={userData.logoUrl}
          alt="User"
          className="rounded-full w-10 h-10 border border-gray-300" />
        <div>
          <p className="font-bold">{userData.nome}</p>
          <p className="text-sm text-gray-600"><small>{userData.sector}</small></p>
        </div>
      </Link>

      <div className="mt-4">
  {!editProvince ? (
    <div className="flex items-center gap-2">
      <p className="font-semibold">Província: {provincia}</p>
      <button
        onClick={() => setEditProvince(true)}
        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition">
        Editar
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <select
        value={provincia}
        onChange={(e) => setProvince(e.target.value)}
        className="border border-gray-300 p-1 rounded">
        <option value="Maputo">Maputo</option>
        <option value="Gaza">Gaza</option>
        <option value="Inhambane">Inhambane</option>
        <option value="Sofala">Sofala</option>
        <option value="Manica">Manica</option>
        <option value="Tete">Tete</option>
        <option value="Zambézia">Zambézia</option>
        <option value="Nampula">Nampula</option>
        <option value="Cabo Delgado">Cabo Delgado</option>
        <option value="Niassa">Niassa</option>
      </select>
      <button
  onClick={() => {
    saveProvince(provincia);
  }}
  className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
  Salvar
</button>
      <button
        onClick={() => {
          setProvince(user?.provincia || '');
          setEditProvince(false);
        }}
        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">
        Cancelar
      </button>
          
    </div>
  )}
</div>


      <ModuleGrid activeModules={userData.activeModules || []} />

      <div className="w-full logout-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        onClick={handleLogout}>
        Desconectar
        <ExitToApp />
      </div>
    </div>
  );
};

export default Apx;
