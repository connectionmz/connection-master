import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
      if (snapshot.exists()) {
        const data = snapshot.val();
        const modules = {};

        Object.keys(data).forEach(moduleKey => {
          const moduleData = data[moduleKey];
          if (moduleData && moduleData.isActive && new Date(moduleData.end) > new Date()) {
            modules[moduleKey] = true;
          }
        });
        
        setActiveModules(modules);
      } else {
        setActiveModules({});
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching modules:", error);
      setActiveModules({});
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const value = useMemo(() => ({ activeModules, isLoading }), [activeModules, isLoading]);

  return (
    <ActiveModulesContext.Provider value={value}>
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