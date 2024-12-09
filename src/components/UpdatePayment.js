import { ref, update, push, set } from 'firebase/database';
import { db } from '../fb'; // Importa a instância do Firebase

export const UpdatePayment = (user, moduleKey, paymentDetails) => {
  console.log("Dados do utilizador:", user);
  console.log("Dados do pagamento:", paymentDetails);

  const { id: userId, displayName } = user;
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1; // Mês atual (1-12)
  const year = currentDate.getFullYear(); // Ano atual

  // Referências para o Firebase
  const userActiveModulesRef = ref(db, `users/${userId}/activeModules`);
  const userSubscriptionsRef = ref(db, `subscriptions/${userId}/${year}/${month}`);

  // Atualiza activeModules com o módulo pago
  const updates = {};
  updates[`/users/${userId}/activeModules/${moduleKey}`] = {
    paidAt: currentDate.toISOString(),
    moduleKey: moduleKey,
    status: 'active',
  };

  // Salva os detalhes de pagamento em subscriptions
  const paymentData = {
    moduleKey: moduleKey,
    amount: paymentDetails.amount,
    method: paymentDetails.method,
    paidAt: currentDate.toISOString(),
    userName: displayName || 'Cliente Anônimo',
  };

  try {
    // Atualiza o campo activeModules
    update(userActiveModulesRef, updates);

    // Salva os detalhes em subscriptions
    const newPaymentRef = push(userSubscriptionsRef); // Gera um ID único
    set(newPaymentRef, paymentData);

    console.log('Pagamento atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
  }
};
