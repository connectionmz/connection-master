import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../fb';

const StoreDetails = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

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

            {/* Produtos */}
            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {store.products &&
                        Object.entries(store.products).map(([productId, product]) => (
                            <div
                                key={productId}
                                className="bg-white shadow-md rounded-md overflow-hidden transform hover:scale-105 transition-transform"
                            >
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-40 object-cover"
                                />
                                <div className="p-4">
                                    <h2 className="text-lg font-semibold mb-2">{product.name}</h2>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {product.discount ? `Desconto: ${product.discount}` : ''}
                                    </p>
                                    <p className="text-base font-bold text-gray-800 mb-4">
                                        {product.price} MT
                                    </p>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                                    >
                                        Adicionar ao Carrinho
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            </main>

            {/* Carrinho de Compras */}
            {cartOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white w-96 rounded-lg shadow-lg">
                        <div className="border-b p-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Carrinho de Compras</h3>
                            <button onClick={() => setCartOpen(false)}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-4">
                            {cart.length === 0 ? (
                                <p>Seu carrinho está vazio.</p>
                            ) : (
                                <ul className="divide-y">
                                    {cart.map((item, index) => (
                                        <li key={index} className="py-2 flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <span>{item.price} MT</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="border-t p-4">
                            <button
                                onClick={generateInvoice}
                                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
                            >
                                Baixar Fatura
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreDetails;
