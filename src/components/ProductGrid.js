import React from 'react';
import { Link } from 'react-router-dom';

const ProductGrid = ({ products, storeId }) => {
    if (!products || Object.keys(products).length === 0) {
        return <p className="text-center text-gray-500">Nenhum produto disponível no momento.</p>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries(products).map(([productId, product]) => (
                <div
                    key={productId}
                    className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                   <Link to={`/product/${productId}/store/${storeId}`}>
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-48 object-cover"/>
                        <div className="p-4">
                            <h2 className="text-lg font-semibold mb-1 text-gray-900">{product.name}</h2>
                            <p className="text-sm text-gray-600 mb-1">
                                {product.discount ? `Oferta: ${product.discount}%` : ''}
                            </p>
                            <p className="text-sm text-gray-500 mb-1">
                                {product.sales ? `${product.sales} vendido(s)` : ''}
                            </p>
                            <p className="text-base font-bold text-red-600">{product.price} MT</p>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
};

export default ProductGrid;
