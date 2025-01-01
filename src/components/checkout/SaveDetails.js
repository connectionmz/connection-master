import { update } from "firebase/database";
import { db } from "../../fb";

export default  handlePaymentSuccess = (paymentDetails, uid) => {
    const userRef = ref(db, `company/${uid}/activeModules/moduloSMS`);
    update(userRef, { status: 'active', activatedAt: new Date().toISOString(), paymentDetails })
        .then(() => {
            alert('Módulo SMS ativado com sucesso!');
            if (onModuleActivation) onModuleActivation(); 

            window.location.reload();

        })
        .catch((error) => {
            console.error('Erro ao ativar o módulo SMS: ', error);
        });
};