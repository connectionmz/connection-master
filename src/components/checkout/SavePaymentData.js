import { ref, push, update } from 'firebase/database';
import { db } from '../../fb';

const SavePaymentData = async ({ companyId, planKey, paymentData, recurring = false }) => {

  const planos = {
    basico: {
      name: 'Básico',
      price: 250,
      modules: {
        moduloFaturacao: {
          limit: 10, 
        },
        moduloSMS: {
          limit: 25, 
        },
      },
    },
    pro: {
      name: 'Pro',
      price: 500,
      modules: {
        moduloFaturacao: {
          limit: 40, 
        },
        moduloSMS: {
          limit: 100, 
        },
        moduloMarket: {
          limit: 50, 
        },
      },
    },
    premium: {
      name: 'Premium',
      price: 750,
      modules: {
        moduloFaturacao: {
          limit: 'ilimitado',
        },
        moduloSMS: {
          limit: 150,
        },
        moduloMarket: {
          limit: 'ilimitado', 
        },
        moduloAnalytics: {
          limit: 'ilimitado', 
        },
      },
    },
  };

  const plan = planos[planKey];
  if (!plan) {
    throw new Error('Plano inválido.');
  }

  const currentDate = new Date();
  const startDate = currentDate.toISOString().split('T')[0];
  const expiryDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
    .toISOString()
    .split('T')[0];

  const subscriptionData = {
    companyId,
    plan: {
      name: plan.name,
      price: plan.price,
      modules: plan.modules,
      duration: '1 mês',
    },
    payment: {
      amount: paymentData.amount,
      method: paymentData.method,
      transactionId: paymentData.transactionId || null,
      date: new Date().toISOString(),
    },
    status: 'active',
    startDate,
    expiryDate,
    recurring,
  };

  try {
    await push(ref(db, 'subscriptions'), subscriptionData);

    const companyRef = ref(db, `company/${companyId}/subscriptions`);
    await push(companyRef, subscriptionData);

    await update(ref(db, `company/${companyId}`), {
      status: true,
      subscriptionExpiryDate: expiryDate,
      activeModules: plan.modules,
    });

  } catch (error) {
    console.error('Erro ao salvar a subscrição:', error);
    throw new Error('Erro ao processar o pagamento.');
  }
};

export default SavePaymentData;
