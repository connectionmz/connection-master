// contexts/ActiveModulesContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../fb';

const ActiveModulesContext = createContext();

export const ActiveModulesProvider = ({ children, userId }) => {
  const [activeModules, setActiveModules] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setActiveModules({});
      setIsLoading(false);
      return;
    }

    const modulesRef = ref(db, `subscriptions/${userId}`);
    const unsubscribe = onValue(modulesRef, (snapshot) => {
      const data = snapshot.val();
      const modules = {};

      if (data) {
        Object.keys(data).forEach(moduleKey => {
          const moduleData = data[moduleKey];
          if (moduleData.isActive && new Date(moduleData.end) > new Date()) {
            modules[moduleKey] = true;
          }
        });
      }

      setActiveModules(modules);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <ActiveModulesContext.Provider value={{ activeModules, isLoading }}>
      {children}
    </ActiveModulesContext.Provider>
  );
};

export const useActiveModules = () => {
  const context = useContext(ActiveModulesContext);
  if (!context) {
    throw new Error('useActiveModules must be used within an ActiveModulesProvider');
  }
  return context;
};