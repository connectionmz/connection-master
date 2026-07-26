import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../fb';

const ActiveModulesContext = createContext();

/**
 * Fonte única da verdade para módulos ativos: company/{userId}/activeModules
 * Formato de cada módulo: { status: 'active', expiresAt: timestamp, paidAt, ... }
 *
 * Esse é o mesmo node que o painel admin (EmpresaDetalhes.jsx) já edita ao
 * ativar/remover módulos manualmente — antes disso, o app lia de
 * `subscriptions/{userId}` (um node diferente, nunca tocado pelo admin),
 * por isso um módulo ativado no painel não refletia no app.
 */
export const ActiveModulesProvider = ({ children, userId }) => {
  const [activeModules, setActiveModules] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setActiveModules({});
      setIsLoading(false);
      return;
    }

    const modulesRef = ref(db, `company/${userId}/activeModules`);

    const unsubscribe = onValue(modulesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const modules = {};
          const now = Date.now();

          Object.keys(data).forEach(moduleKey => {
            const moduleData = data[moduleKey];

            if (!moduleData || moduleData.status !== 'active') return;

            // Módulo sem data de expiração é tratado como válido (ex: vitalício/trial sem prazo)
            if (moduleData.expiresAt) {
              const expiresAtTimestamp = Number(moduleData.expiresAt);
              if (isNaN(expiresAtTimestamp) || expiresAtTimestamp <= now) return;
            }

            // Mantém o objeto completo (status, expiresAt, paidAt, smsCount, etc.)
            // para que componentes como ModuleGrid.jsx continuem funcionando
            // sem precisar de mudanças adicionais.
            modules[moduleKey] = moduleData;
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