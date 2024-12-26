import React, { useState } from 'react';
import axios from 'axios';
import { ref, set } from 'firebase/database';
import { db } from '../../fb';

const CreateStoreForm = ({ storeId, planPrice = 800 , user }) => {
    console.log(user)
    const [store, setStore] = useState({ name: '', description: '', company: user || '', logoUrl: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [logo, setLogo] = useState(null); 

    const handleInputChange = (e) => {
        setStore({ ...store, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setStore({ ...store, logoUrl: URL.createObjectURL(file) });
        }
    };

    const handlePayment = async () => {
        setIsLoading(true);

        // Simulando a criação da loja sem o pagamento
        try {
            // Aqui pode-se adicionar a lógica de pagamento se necessário
            return true;
        } catch (error) {
            alert('A transação falhou. Por favor, tente novamente.');
            console.error('Erro no pagamento:', error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const createStore = async () => {
        setIsLoading(true);

        // Verifique se o 'user' está definido antes de criar a loja
        if (!user) {
            alert('Usuário não definido. Não é possível criar a loja.');
            setIsLoading(false);
            return;
        }

        const paymentSuccessful = await handlePayment();

        if (paymentSuccessful) {
            try {
                const storeRef = ref(db, `stores/${storeId}`);
                await set(storeRef, store);
                alert('Loja criada com sucesso!');
                window.location.reload();
            } catch (error) {
                alert('Erro ao criar a loja.');
                console.error('Erro:', error);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* Informação sobre a taxa */}
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md mb-4">
                <p className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> A subscrição de uma loja online requer o pagamento único de <strong>{planPrice} MT</strong>.
                </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">Criar Loja</h2>

            {/* Campo de nome da loja */}
            <input
                type="text"
                name="name"
                value={store.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md mb-4"
                placeholder="Nome da Loja"
            />

            {/* Campo de descrição da loja */}
            <textarea
                name="description"
                value={store.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md mb-4"
                placeholder="Descrição da Loja"
            />

            {/* Campo para o logotipo */}
            <input
                type="file"
                onChange={handleLogoChange}
                className="w-full p-2 border rounded-md mb-4"
            />
            {logo && <img src={URL.createObjectURL(logo)} alt="Logo" className="w-20 h-20 object-cover mb-4" />}

            {/* Botão de criação da loja */}
            <button
                className={`bg-blue-500 text-white py-2 px-4 rounded-md ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={createStore}
                disabled={isLoading}
            >
                {isLoading ? 'Criando Loja...' : 'Criar Loja'}
            </button>
        </div>
    );
};

export default CreateStoreForm;
