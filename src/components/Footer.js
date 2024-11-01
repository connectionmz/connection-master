import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Article, Work, Store, Login as LoginIcon } from '@mui/icons-material'; 
import { useAuthState } from 'react-firebase-hooks/auth';
import { Avatar, IconButton } from '@mui/material';
import { auth } from '../fb';

const Footer = ({ user }) => {
  const [mUser] = useAuthState(auth); 
  const handleProfileClick = () => {
    if (mUser) {
      window.location = '/apx' 
    } else {
      window.location = '/auth' 
    }
  };

  return (
    <footer
      className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300"
      style={{ backgroundImage: 'linear-gradient(43deg, #1f1f27, #623142 46%, #221d1d)', color: '#FFF' }}>
      <div className="flex justify-between items-center max-w-md mx-auto py-2 px-4">
        <Link to="/" className="flex flex-col items-center text-white">
          <Home />
          <span className="text-xs">Inicio</span>
        </Link>
        <Link to="/cotacao" className="flex flex-col items-center text-white">
          <Article />
          <span className="text-xs">Cotação</span>
        </Link>
        <Link to="/concurso" className="flex flex-col items-center text-white">
          <Work />
          <span className="text-xs">Concurso</span>
        </Link>
        <Link to="/explore" className="flex flex-col items-center text-white">
          <Store />
          <span className="text-xs">Empresas</span>
        </Link>
        <IconButton onClick={handleProfileClick} className="flex flex-col items-center text-white">
          {mUser ? (
            <>
              <Avatar src={user?.logoUrl || mUser.photoURL} alt={user?.logoUrl || 'Perfil'} /> 
            </>
          ) : (
            <>
              <LoginIcon />
              <span className="text-xs">Login</span>
            </>
          )}
        </IconButton>
      </div>
    </footer>
  )
}
export default Footer