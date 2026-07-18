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
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const modules = {};
          const now = Date.now(); // Usando timestamp para comparação mais eficiente

          Object.keys(data).forEach(moduleKey => {
            const moduleData = data[moduleKey];
            
            // Verifica se o módulo existe e está ativo
            if (moduleData && moduleData.isActive === true && moduleData.end) {
              const endTimestamp = Number(moduleData.end);
              
              // Verifica se o timestamp é válido
              if (!isNaN(endTimestamp) && endTimestamp > 0) {
                // Comparação direta de timestamps (mais eficiente)
                if (endTimestamp > now) {
                  modules[moduleKey] = true;
                }
              }
            }
          });
          
          setActiveModules(modules);
        } else {
          setActiveModules({});
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error processing modules:", error);
        setActiveModules({});
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Error fetching modules:", error);
      setActiveModules({});
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const value = useMemo(() => ({ 
    activeModules, 
    isLoading,
    // Métodos auxiliares
    isModuleActive: (moduleKey) => !!activeModules[moduleKey],
    getActiveModulesList: () => Object.keys(activeModules),
    getActiveModulesCount: () => Object.keys(activeModules).length
  }), [activeModules, isLoading]);

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