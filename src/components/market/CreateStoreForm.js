import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../../fb';

const CreateStoreForm = ({ storeId }) => {
    const [store, setStore] = useState({ name: '', description: '' });
    const handleInputChange = (e) => {
        setStore({ ...store, [e.target.name]: e.target.value });
    };

    const createStore = async () => {
        const storeRef = ref(db, `stores/${storeId}`);
        await set(storeRef, store);
        window.location.reload(); 
    };
    return (
        <div>
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
            <button
                className="bg-blue-500 text-white py-2 px-4 rounded-md"
                onClick={createStore}
            >
                Criar Loja
            </button>
        </div>
    );
};

export default CreateStoreForm;
