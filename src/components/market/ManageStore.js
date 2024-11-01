import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, remove, update } from 'firebase/database';
import { db } from '../../fb';
import ProductForm from './ProductForm';
import { Link } from 'react-router-dom';

const ManageStore = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [editProductData, setEditProductData] = useState(null);
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

  const handleProductAdd = (newProducts) => {
    setProducts((prevProducts) => [...prevProducts, ...newProducts]);
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

  };

  const handleProductUpdate = async (updatedProduct) => {
    try {
      const productRef = ref(db, `stores/${storeId}/products/${editProductId}`);
      await update(productRef, updatedProduct);
      setProducts((prevProducts) =>
        prevProducts.map(([key, product]) =>
          key === editProductId ? [key, updatedProduct] : [key, product]
        )
      );
      resetFormState();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar o produto. Tente novamente.');
    }
  };

  const resetFormState = () => {
    setEditProductId(null);
    setEditProductData(null);
    setShowAddProductForm(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(([key, product]) =>
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="w-full bg-white">
      <h2 className="text-2xl font-semibold mb-4 flex items-center justify-between">
        Gerir Loja
        <Link to={`/addProduct/${storeId}`} className="text-blue-500 hover:underline text-lg">
          +
        </Link>
      </h2>
      <div className="flex justify-between items-center mb-4">
        <button
          className={`${
            showAddProductForm ? 'bg-gray-300' : 'bg-blue-500'
          } transition duration-300 ease-in-out text-white py-2 px-4 rounded hover:bg-blue-400`}
          onClick={() => {
            setShowAddProductForm(!showAddProductForm);
            resetFormState();
          }}
        >
          {editProductId ? 'Editar Produto' : 'Adicionar Produto'}
        </button>
      </div>

      {showAddProductForm && (
        <div className="mb-4">
          <ProductForm
            storeId={storeId}
            setProducts={setProducts}
            initialProductData={editProductData}
            onUpdateProduct={handleProductUpdate}
            onAddProduct={handleProductAdd}
          />
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Pesquisar produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando produtos...</p>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-2">Produtos</h3>
          {filteredProducts.length > 0 ? (
           <div className="overflow-auto max-w-full">
           <table className="min-w-full">
             <thead>
               <tr className="bg-gray-100">
                 <th className="px-4 py-2 text-left">Imagem</th>
                 <th className="px-4 py-2 text-left">Nome</th>
                 <th className="px-4 py-2 text-left">Preço</th>
                 <th className="px-4 py-2 text-left">Descrição</th>
                 <th className="px-4 py-2 text-left">Ações</th>
               </tr>
             </thead>
             <tbody>
               {filteredProducts.map(([key, product]) => (
                 <tr key={key} className="border-t hover:bg-gray-50">
                   <td className="px-4 py-2">
                     {product?.imageUrl ? (
                       <img
                         src={product.imageUrl}
                         alt={product.name}
                         className="w-16 h-16 object-cover rounded"
                       />
                     ) : (
                       <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">
                         Sem imagem
                       </div>
                     )}
                   </td>
                   <td className="px-4 py-2">{product?.name || 'Sem nome'}</td>
                   <td className="px-4 py-2">{product?.price || 'Sem preço'} MZN</td>
                   <td className="px-4 py-2">{product?.description || 'Sem descrição'}</td>
                   <td className="px-4 py-2">
                     <button
                       className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 transition duration-200 hover:bg-yellow-400"
                       onClick={() => handleEditProduct(key, product)}
                       aria-label="Editar produto"
                     >
                       Editar
                     </button>
                     <button
                       className="bg-red-500 text-white px-2 py-1 rounded transition duration-200 hover:bg-red-400"
                       onClick={() => handleRemoveProduct(key)}
                       aria-label="Remover produto"
                     >x
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
