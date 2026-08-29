import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const GuestRoute = ({ user, children, loading = false, redirectTo = '/' }) => {
  if (user && loading) {
    return (
      <Box minHeight="50vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress aria-label="Loading profile" />
      </Box>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default GuestRoute;
