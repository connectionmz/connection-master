import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../fb";

const ProductDetails = () => {
  const { productId, store } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const IVA_PERCENTAGE = 16;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const productRef = ref(db, `stores/${store}/products/${productId}`);
        const productSnapshot = await get(productRef);
        if (productSnapshot.exists()) {
          setProduct(productSnapshot.val());
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Erro ao buscar os detalhes do produto:", error);
      }
      setLoading(false);
    };

    fetchProductDetails();
  }, [productId, store]);

  const addToCart = () => {
    if (product) {
      alert(
        `${quantity} x ${product.name} foi adicionado ao carrinho por um total de ${(product.price * quantity).toFixed(
          2
        )} MT (sem IVA).`
      );
    }
  };

  const handlePayment = () => {
    if (product) {
      const total = product.price * quantity;
      const iva = (total * IVA_PERCENTAGE) / 100;
      const totalWithIva = total + iva;
      alert(
        `Pagamento iniciado para ${quantity} x ${product.name}. Valor: ${totalWithIva.toFixed(
          2
        )} MT (incluindo ${iva.toFixed(2)} MT de IVA).`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!product) {
    return <p className="text-center text-red-500">Produto não encontrado.</p>;
  }

  const total = product.price * quantity;
  const iva = (total * IVA_PERCENTAGE) / 100;
  const totalWithIva = total + iva;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {product.name}
            </h1>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <p className="text-xl font-semibold text-red-600 mb-6">
              Preço: {product.price} MT (por unidade)
            </p>
            <div className="flex items-center gap-4 mb-6">
              <label htmlFor="quantity" className="text-gray-600">
                Quantidade:
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const value = Math.max(1, Number(e.target.value));
                  setQuantity(value);
                }}
                className="w-16 p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-gray-700 mb-2">
              Subtotal: {total.toFixed(2)} MT
            </p>
            <p className="text-gray-700 mb-2">
              IVA ({IVA_PERCENTAGE}%): {iva.toFixed(2)} MT
            </p>
            <p className="text-xl font-bold text-gray-800 mb-6">
              Total com IVA: {totalWithIva.toFixed(2)} MT
            </p>
            <div className="flex gap-4">
              <button
                onClick={addToCart}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adicionar ao Carrinho
              </button>
              <button
                onClick={handlePayment}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Pagar Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
