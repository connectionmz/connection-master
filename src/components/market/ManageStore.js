import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, remove, update } from 'firebase/database';
import { db } from '../../fb';
import ProductForm from './ProductForm';

const ManageStore = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = ref(db, `stores/${storeId}/products`);
        const productsSnapshot = await get(productsRef);

        if (productsSnapshot.exists()) {
          setProducts(Object.entries(productsSnapshot.val()));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        alert('Ocorreu um erro ao buscar produtos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storeId]);

  const handleProductAdd = (newProduct) => {
    setProducts((prevProducts) => [...prevProducts, newProduct]);
    resetFormState();
  };

  const handleRemoveProduct = async (productId) => {
    const confirmRemove = window.confirm('Tem a certeza que deseja remover este produto?');
    if (confirmRemove) {
      try {
        const productRef = ref(db, `stores/${storeId}/products/${productId}`);
        await remove(productRef);
        setProducts((prevProducts) => prevProducts.filter(([key]) => key !== productId));
      } catch (error) {
        console.error('Erro ao remover produto:', error);
        alert('Erro ao remover o produto. Tente novamente.');
      }
    }
  };

  const handleEditProduct = (productId, productData) => {
    setEditingProduct({ id: productId, ...productData });
    setShowProductForm(true);
  };

  const handleProductUpdate = async (updatedProduct) => {
    try {
      const productRef = ref(db, `stores/${storeId}/products/${editingProduct.id}`);
      await update(productRef, updatedProduct);
      
      setProducts((prevProducts) =>
        prevProducts.map(([key, product]) =>
          key === editingProduct.id ? [key, updatedProduct] : [key, product]
        )
      );
      
      resetFormState();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar o produto. Tente novamente.');
    }
  };

  const resetFormState = () => {
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(([key, product]) =>
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Gerir Loja</h2>

      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Pesquisar produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
        >
          Adicionar Produto
        </button>
      </div>

      {showProductForm && (
        <div className="mb-6">
          <ProductForm
            storeId={storeId}
            onAddProduct={handleProductAdd}
            onUpdateProduct={handleProductUpdate}
            editingProduct={editingProduct}
            onCancel={resetFormState}
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando produtos...</p>
      ) : (
        <div>
          <h3 className="text-2xl font-semibold mb-4">Produtos</h3>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border-collapse shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-6 py-3 text-left">Imagem</th>
                    <th className="px-6 py-3 text-left">Nome</th>
                    <th className="px-6 py-3 text-left">Preço</th>
                    <th className="px-6 py-3 text-left">Descrição</th>
                    <th className="px-6 py-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(([key, product]) => (
                    <tr key={key} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3">
                        {product?.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-lg">
                            Sem imagem
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">{product?.name || 'Sem nome'}</td>
                      <td className="px-6 py-3">{product?.price || 'Sem preço'} MZN</td>
                      <td className="px-6 py-3">{product?.description || 'Sem descrição'}</td>
                      <td className="px-6 py-3 flex items-center space-x-2">
                        <button
                          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
                          onClick={() => handleEditProduct(key, product)}
                        >
                          Editar
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                          onClick={() => handleRemoveProduct(key)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageStore;