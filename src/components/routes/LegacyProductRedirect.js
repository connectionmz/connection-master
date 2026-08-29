import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const LegacyProductRedirect = () => {
  const { id, loja } = useParams();

  return <Navigate to={`/product/${id}/store/${loja}`} replace />;
};

export default LegacyProductRedirect;
