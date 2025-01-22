import { ref, update, push, set, remove } from 'firebase/database';
import { db } from '../fb'; // Importa a instância do Firebase

/**
 * Atualiza o pagamento e salva os dados no Firebase.
 * @param {Object} user - Objeto com informações do usuário.
 * @param {string} moduleKey - Chave do módulo pago.
 * @param {Object} paymentDetails - Detalhes do pagamento (quantia, método).
 */
export const UpdatePayment = (user, moduleKey, paymentDetails) => {

  const smsCount = paymentDetails?.smsCount


  const { id: userId, displayName } = user; 
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1; 
  const year = currentDate.getFullYear(); // Ano atual

  // Referências no Firebase
  const activeModulesRef = ref(db, `company/${userId}/activeModules/${moduleKey}`);
  const subscriptionsRef = ref(db, `subscriptions/${userId}/${year}/${month}`);

  const activeModuleData = {
    paidAt: currentDate.toISOString(),
    moduleKey: moduleKey,
    status: 'active',
    ...(moduleKey === 'moduloSMS' && { smsCount }), // Inclui smsCount somente para módulo SMS
  };

  const paymentData = {
    moduleKey: moduleKey,
    amount: paymentDetails.amount,
    method: paymentDetails.method,
    paidAt: currentDate.toISOString(),
    userName: displayName || 'Cliente Anônimo',
  };

  // Executa a atualização
  try {
    // Atualiza o módulo ativo em "company/userId/activeModules"
    set(activeModulesRef, activeModuleData);

    // Adiciona os detalhes do pagamento em "subscriptions"
    const newPaymentRef = push(subscriptionsRef);
    set(newPaymentRef, paymentData);

    console.log('Pagamento atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
  }
};

/**
 * Remove um módulo ativo para um usuário.
 * @param {string} userId - ID do usuário.
 * @param {string} moduleKey - Chave do módulo ativo a ser removido.
 */
export const DeleteActiveModule = (userId, moduleKey) => {
  // Verifica se os parâmetros obrigatórios foram passados
  if (!userId || !moduleKey) {
    console.error('ID do usuário e chave do módulo são obrigatórios.');
    return;
  }

  // Caminho da referência no Firebase
  const activeModuleRef = ref(db, `company/${userId}/activeModules/${moduleKey}`);

  try {
    // Remove o módulo ativo do Firebase
    remove(activeModuleRef)
      .then(() => {
        console.log(`Módulo ${moduleKey} removido com sucesso para o usuário ${userId}.`);
      })
      .catch((error) => {
        console.error('Erro ao remover o módulo ativo:', error);
      });
  } catch (error) {
    console.error('Erro inesperado ao remover o módulo ativo:', error);
  }
};
