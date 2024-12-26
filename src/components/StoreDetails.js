import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../fb';
import ProductGrid from './ProductGrid';

const StoreDetails = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);


    console.log(storeId)

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                const storeRef = ref(db, `stores/${storeId}`);
                const storeSnapshot = await get(storeRef);
                if (storeSnapshot.exists()) {
                    setStore(storeSnapshot.val());
                } else {
                    setStore(null);
                }
            } catch (error) {
                console.error("Erro ao buscar os detalhes da loja:", error);
            }
            setLoading(false);
        };
        fetchStoreDetails();
    }, [storeId]);

    const addToCart = (product) => {
        setCart((prevCart) => [...prevCart, product]);
        alert(`${product.name} foi adicionado ao carrinho.`);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: store.name,
                text: `Confira essa loja incrível: ${store.name}!`,
                url: window.location.href,
            }).catch((error) => console.error('Erro ao compartilhar', error));
        } else {
            alert('Compartilhamento não suportado neste dispositivo.');
        }
    };

    const generateInvoice = () => {
        const total = cart.reduce((sum, product) => sum + product.price, 0);
        alert(`Fatura gerada com sucesso! Total: ${total} MZN`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader"></div>
            </div>
        );
    }

    if (!store) {
        return <p className="text-center text-red-500">Loja não encontrada.</p>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-icons text-gray-600">store</span>
                        {store.name}
                    </h1>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-600 hover:text-gray-800" onClick={handleShare}>
                            <span className="material-icons">share</span>
                        </button>
                        <button
                            className="relative text-gray-600 hover:text-gray-800"
                            onClick={() => setCartOpen(true)}
                        >
                            <span className="material-icons">shopping_cart</span>
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
            <ProductGrid products={store.products} storeId={storeId}/>
            </main>
        </div>
    );
};

export default StoreDetails;
