import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../fb';
import ManageStore from '../market/ManageStore';
import CreateStoreForm from '../market/CreateStoreForm';

const MarketDesk = ({user}) => {


    console.log(user)
    const [storeExists, setStoreExists] = useState(null);
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkStoreExists = async (userId) => {
            try {
                const storeRef = ref(db, `stores/${userId}`);
                const storeSnapshot = await get(storeRef);

                if (storeSnapshot.exists()) {
                    setStoreExists(true);
                } else {
                    setStoreExists(false);
                }
            } catch (err) {
                console.error('Erro ao verificar loja:', err);
                setError('Ocorreu um erro ao carregar as informações da loja. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setStoreId(user.uid);
                checkStoreExists(user.uid);
            } else {
                setStoreId(null);
                setStoreExists(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg font-semibold text-gray-600">Carregando...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-red-500">{error}</p>
            </div>
        );
    }

    if (!storeId) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg font-semibold text-gray-600">Por favor, faça login para acessar o Market.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
            {storeExists ? (
                <ManageStore storeId={storeId} />
            ) : (
                <CreateStoreForm storeId={storeId} user={user}/>
            )}
        </div>
    );
};

export default MarketDesk;
