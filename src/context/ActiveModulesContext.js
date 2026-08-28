import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../fb';

const ActiveModulesContext = createContext();
const EMPTY_ACTIVE_MODULES = {};

export const normalizeExpirationTimestamp = (expiresAt) => {
  if (expiresAt === undefined || expiresAt === null || expiresAt === '') {
    return null;
  }

  const numericTimestamp = Number(expiresAt);
  if (Number.isFinite(numericTimestamp)) {
    return numericTimestamp;
  }

  const parsedTimestamp = Date.parse(expiresAt);
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : NaN;
};

export const filterActiveModules = (modulesData, now = Date.now()) => {
  if (!modulesData || typeof modulesData !== 'object') {
    return {};
  }

  return Object.entries(modulesData).reduce((modules, [moduleKey, moduleData]) => {
    if (!moduleData || moduleData.status !== 'active') {
      return modules;
    }

    const expirationTimestamp = normalizeExpirationTimestamp(moduleData.expiresAt);
    if (Number.isNaN(expirationTimestamp) || (
      expirationTimestamp !== null && expirationTimestamp <= now
    )) {
      return modules;
    }

    modules[moduleKey] = moduleData;
    return modules;
  }, {});
};

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
  const [moduleState, setModuleState] = useState({
    userId: null,
    activeModules: {},
    isLoading: false,
    error: null,
  });

  const isCurrentUser = moduleState.userId === userId;
  const activeModules = isCurrentUser ? moduleState.activeModules : EMPTY_ACTIVE_MODULES;
  const isLoading = Boolean(userId) && (!isCurrentUser || moduleState.isLoading);
  const error = isCurrentUser ? moduleState.error : null;

  useEffect(() => {
    let isCurrentSubscription = true;

    setModuleState({
      userId: userId || null,
      activeModules: {},
      isLoading: Boolean(userId),
      error: null,
    });

    if (!userId) {
      return undefined;
    }

    const modulesRef = ref(db, `company/${userId}/activeModules`);

    const unsubscribe = onValue(modulesRef, (snapshot) => {
      if (!isCurrentSubscription) return;

      try {
        const modules = snapshot.exists()
          ? filterActiveModules(snapshot.val())
          : {};

        setModuleState({
          userId,
          activeModules: modules,
          isLoading: false,
          error: null,
        });
      } catch (processingError) {
        console.error("Error processing modules:", processingError);
        setModuleState({
          userId,
          activeModules: {},
          isLoading: false,
          error: processingError,
        });
      }
    }, (fetchError) => {
      if (!isCurrentSubscription) return;

      console.error("Error fetching modules:", fetchError);
      setModuleState({
        userId,
        activeModules: {},
        isLoading: false,
        error: fetchError,
      });
    });

    return () => {
      isCurrentSubscription = false;
      unsubscribe();
    };
  }, [userId]);

  const value = useMemo(() => ({
    activeModules,
    isLoading,
    error,
    // Métodos auxiliares
    isModuleActive: (moduleKey) => !!activeModules[moduleKey],
    getActiveModulesList: () => Object.keys(activeModules),
    getActiveModulesCount: () => Object.keys(activeModules).length
  }), [activeModules, isLoading, error]);

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
