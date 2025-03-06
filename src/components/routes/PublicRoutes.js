import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FeedDesk from '../desktop/FeedDesk';


const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedDesk />} />
     
    </Routes>
  );
};

export default PublicRoutes;