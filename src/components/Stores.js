import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';  

const Stores = () => {
    const [storesList, setStoresList] = useState([]);

    useEffect(() => {
        const storesRef = ref(db, 'stores');

        const unsubscribe = onValue(storesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const storesArray = Object.entries(data).map(([id, store]) => ({
                    id,
                    ...store
                }));
                setStoresList(storesArray);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Lojas Disponíveis</h1>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storesList.length > 0 ? (
                    storesList.map(store => (
                        <div key={store.id} className="bg-white p-4 shadow-md rounded-md">
                             <Link
                                to={`/stores/${store.id}`}
                                className="">
                            {/* Exibe o logo da loja */}
                            {store.photoUrl && (
                                <img
                                    src={store.photoUrl}
                                    alt={`${store.name} logo`}
                                    className="w-full h-40 object-cover mb-4 rounded"
                                />
                            )}
                            <h2 className="text-lg text-center font-semibold mb-2">{store.name}</h2>
                            <p className="mb-4 text-center"><small>{store.description}</small></p>                            
                            </Link>
                        </div>
                    ))
                ) : (
                    <p>Nenhuma loja disponível no momento.</p>
                )}
            </div>
        </div>
    );
};

export default Stores;
