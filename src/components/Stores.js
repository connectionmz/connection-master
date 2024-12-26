import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';

// Função para embaralhar arrays
const shuffleArray = (array) => {
    return array
        .map((item) => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);
};

const Stores = ({user}) => {
    const [storesList, setStoresList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStores, setFilteredStores] = useState([]);

    useEffect(() => {
        const storesRef = ref(db, 'stores');

        const unsubscribe = onValue(storesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const storesArray = Object.entries(data).map(([id, store]) => ({
                    id,
                    ...store,
                }));
                const shuffledStores = shuffleArray(storesArray); 
                setStoresList(shuffledStores);
                setFilteredStores(shuffledStores);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = storesList.filter((store) =>
                store.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredStores(shuffleArray(filtered)); 
        } else {
            setFilteredStores(shuffleArray(storesList)); 
        }
    }, [searchQuery, storesList]);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Lojas Disponíveis</h1>
            <div className="mb-6 flex justify-center">
                <input
                    type="text"
                    placeholder="Pesquisar loja por nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
            {/* Lista de Lojas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                        <div
                            key={store.id}
                            className="bg-white border border-gray-200 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            <Link to={`/stores/${store.id}`} className="block">
                                {/* Imagem do Logo */}
                                {store.photoUrl && (
                                    <img
                                        src={store.photoUrl}
                                        alt={`${store.name} logo`}
                                        className="w-full h-40 object-cover rounded-t-lg"
                                    />
                                )}
                                <div className="p-4">
                                    {/* Nome da Loja */}
                                    <h2 className="text-lg font-semibold text-gray-800 truncate text-center">
                                        {store.name}
                                    </h2>
                                    {/* Descrição da Loja */}
                                    <p className="text-gray-600 text-sm mt-2 text-center h-12 overflow-hidden">
                                        {store.description || 'Sem descrição disponível'}
                                    </p>
                                    {/* Botão de Ação */}
                                    <div className="mt-4 text-center">
                                        <button className="bg-green-500 text-white text-sm py-2 px-6 rounded hover:bg-green-600 transition duration-200">
                                            Visitar Loja
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">Nenhuma loja encontrada.</p>
                )}
            </div>
        </div>
    );
};

export default Stores;
