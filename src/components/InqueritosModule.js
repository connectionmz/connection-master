import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../fb';
import CriarInquerito from './CriarInquerito';

const InqueritosModule = ({ user }) => {
  const [inqueritos, setInqueritos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('inqueritos');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredInqueritos = inqueritos.filter((inq) => {
    const matchesSearch = inq.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector ? inq.sector === selectedSector : true;
    return matchesSearch && matchesSector;
  });

  const paginatedInqueritos = filteredInqueritos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const inqueritosRef = ref(db, 'surveys');
    setLoading(true);
    onValue(inqueritosRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data)
      const listaInqueritos = data
        ? Object.entries(data)
            .map(([id, details]) => ({ id, ...details }))
            .filter((inquerito) => inquerito.company == user.id) 
        : [];
      setInqueritos(listaInqueritos);
      setLoading(false);
    });
  }, [user.id]);
  
  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este inquérito?')) {
      remove(ref(db, `surveys/${id}`)).then(() => {
        alert('Inquérito excluído com sucesso.');
      });
    }
  };

  const startEdit = (id, currentData) => {
    setEditingId(id);
    setEditData({ title: currentData.title, description: currentData.description });
    setAbaAtiva('editar');
  };

  const saveEdit = () => {
    if (!editData.title || !editData.description) {
      alert('Preencha todos os campos.');
      return;
    }
    update(ref(db, `surveys/${editingId}`), editData).then(() => {
      alert('Inquérito atualizado com sucesso.');
      setEditingId(null);
      setEditData({ title: '', description: '' });
      setAbaAtiva('inqueritos');
    });
  };

  const handleLoadMore = () => {
    if (currentPage * itemsPerPage < filteredInqueritos.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Painel de Inquéritos</h1>

      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`px-4 py-2 ${
            abaAtiva === 'inqueritos' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'
          }`}
          onClick={() => setAbaAtiva('inqueritos')}
        >
          Inquéritos
        </button>
        <button
          className={`px-4 py-2 ${
            abaAtiva === 'novo' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'
          }`}
          onClick={() => setAbaAtiva('novo')}
        >
          Novo
        </button>
      </div>

      {abaAtiva === 'inqueritos' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Lista de Inquéritos</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Pesquisar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-1/2 border p-2 rounded"
            />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full sm:w-1/2 border p-2 rounded"
            >
              <option value="">Todos os setores</option>
              <option value="Saúde">Saúde</option>
              <option value="Educação">Educação</option>
              <option value="Tecnologia">Tecnologia</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : filteredInqueritos.length === 0 ? (
            <p className="text-gray-500">Nenhum inquérito encontrado.</p>
          ) : (
            <ul className="mt-4">
              {paginatedInqueritos.map((inq) => (
                <li key={inq.id} className="border p-4 mb-2 rounded shadow-sm">
                  <h3 className="text-lg font-bold">{inq.title}</h3>
                  <p>{inq.description}</p>
                  <div className="mt-2 flex space-x-4">
                    <button
                      className="text-blue-500"
                      onClick={() => startEdit(inq.id, inq)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-500"
                      onClick={() => handleDelete(inq.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
              {currentPage * itemsPerPage < filteredInqueritos.length && (
                <button
                  onClick={handleLoadMore}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Carregar Mais
                </button>
              )}
            </ul>
          )}
        </div>
      )}

      {abaAtiva === 'novo' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Criar Novo Inquérito</h2>
          <CriarInquerito user={user} />
        </div>
      )}

      {abaAtiva === 'editar' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Editar Inquérito</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Título"
              className="w-full p-2 border rounded"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            />
            <textarea
              placeholder="Descrição"
              className="w-full p-2 border rounded"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
            <div className="flex space-x-4">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={saveEdit}
              >
                Salvar
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => {
                  setEditingId(null);
                  setEditData({ title: '', description: '' });
                  setAbaAtiva('inqueritos');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InqueritosModule;
