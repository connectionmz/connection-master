import React, { useState } from 'react';
import axios from 'axios';
import { ref, set } from 'firebase/database';
import { db } from '../../fb';

const CreateStoreForm = ({ storeId, planPrice = 800 }) => {
    const [store, setStore] = useState({ name: '', description: '' });
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mpesa');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        setStore({ ...store, [e.target.name]: e.target.value });
    };

    const handlePayment = async () => {
        setIsLoading(true);

        const paymentData = {
            carteira: '1729146943643x948653281532969000',
            numero: phoneNumber,
            'quem comprou': 'Cliente',
            valor: planPrice.toString(),
        };

        const endpoint =
            paymentMethod === 'mpesa'
                ? 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa'
                : 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola';

        try {
            const response = await axios.post(endpoint, paymentData);

            if (response.data.status === 'success') {
                alert(`Pagamento de ${planPrice} Mt via ${paymentMethod.toUpperCase()} confirmado com sucesso!`);
                return true;
            } else {
                throw new Error(response.data.message || 'Erro desconhecido.');
            }
        } catch (error) {
            alert('A transação falhou. Por favor, tente novamente.');
            console.error('Erro no pagamento:', error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const createStore = async () => {
        const paymentSuccessful = await handlePayment();

        if (paymentSuccessful) {
            const storeRef = ref(db, `stores/${storeId}`);
            await set(storeRef, store);
            alert('Loja criada com sucesso!');
            window.location.reload();
        }
    };

    return (
        <div>
            {/* Informação sobre a taxa */}
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md mb-4">
                <p className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> A subscrição de uma loja online requer o pagamento único de <strong>{planPrice} MT</strong>. 
                    Pode efetuar o pagamento via <strong>M-Pesa</strong> ou <strong>e-Mola</strong>.
                </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">Criar Loja</h2>
            <input
                type="text"
                name="name"
                value={store.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md mb-4"
                placeholder="Nome da Loja"
            />
            <textarea
                name="description"
                value={store.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md mb-4"
                placeholder="Descrição da Loja"
            />
            <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 border rounded-md mb-4"
                placeholder="Número de telefone"
            />
            <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded-md mb-4"
            >
                <option value="mpesa">M-Pesa</option>
                <option value="emola">e-Mola</option>
            </select>
            <button
                className={`bg-blue-500 text-white py-2 px-4 rounded-md ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={createStore}
                disabled={isLoading}
            >
                {isLoading ? 'Processando...' : 'Criar Loja'}
            </button>
        </div>
    );
};

export default CreateStoreForm;
