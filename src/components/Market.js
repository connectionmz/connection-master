import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth'; 
import ManageStore from './market/ManageStore';
import CreateStoreForm from './market/CreateStoreForm';
import { db, auth } from '../fb'; 

const Market = () => {
    const [storeExists, setStoreExists] = useState(null);
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState(null); 

    useEffect(() => {
        const checkStoreExists = async (userId) => {
            const storeRef = ref(db, `stores/${userId}`);
            const storeSnapshot = await get(storeRef);
            if (storeSnapshot.exists()) {
                setStoreExists(true);
            } else {
                setStoreExists(false);
            }
            setLoading(false);
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setStoreId(user.uid); 
                checkStoreExists(user.uid);
            } else {
                setStoreId(null);
                setLoading(false);
            }
        });

        return () => unsubscribe(); 
    }, []);

    if (loading) {
        return <p>Carregando...</p>;
    }

    if (!storeId) {
        return <p>Utilizador não está logado.</p>; 
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
            {storeExists ? (
                <ManageStore storeId={storeId} />
            ) : (
                <CreateStoreForm storeId={storeId} />
            )}
        </div>
    );
};

export default Market;
