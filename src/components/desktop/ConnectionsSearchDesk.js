import React, { useState } from 'react';
import { FaSearch, FaMicrophone } from 'react-icons/fa';
import logo from '../../img/bg.png';

const ConnectionsSearchDesk = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('concursos'); // Aba ativa
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({
    concursos: [],
    cotacoes: [],
    empresas: [],
    lojas: [],
    inqueritos: [],
  });

  const mockResults = {
    concursos: [
      { id: 1, title: 'Concurso Público 1', description: 'Descrição do concurso público relacionado.' },
      { id: 2, title: 'Concurso Público 2', description: 'Mais detalhes sobre o concurso público.' },
    ],
    cotacoes: [
      { id: 1, title: 'Cotação 1', description: 'Descrição da cotação relacionada.' },
      { id: 2, title: 'Cotação 2', description: 'Mais detalhes sobre a cotação.' },
    ],
    empresas: [
      { id: 1, title: 'Empresa ABC', description: 'Empresa com foco em inovação.' },
      { id: 2, title: 'Empresa XYZ', description: 'Empresa líder em tecnologia.' },
    ],
    lojas: [
      { id: 1, title: 'Loja Online 1', description: 'Loja com grande variedade de produtos.' },
      { id: 2, title: 'Loja Online 2', description: 'Mais opções de compras aqui.' },
    ],
    inqueritos: [
      { id: 1, title: 'Inquérito 1', description: 'Inquérito sobre opinião pública.' },
      { id: 2, title: 'Inquérito 2', description: 'Inquérito sobre temas de interesse.' },
    ],
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);

    setTimeout(() => {
      const filteredResults = Object.keys(mockResults).reduce((acc, category) => {
        acc[category] = mockResults[category].filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase())
        );
        return acc;
      }, {});

      setResults(filteredResults);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-900">
      <h1 className="text-6xl font-google text-blue-600 mb-8">
        <img src={logo} alt="Logo" />
      </h1>

      {/* Barra de Pesquisa */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-lg flex items-center bg-white border border-gray-200 rounded-full shadow-md px-4 py-2 mb-6"
      >
        <FaSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite sua pesquisa ou fale"
          className="flex-grow px-2 py-2 focus:outline-none text-lg"
        />
        <FaMicrophone className="text-blue-500 ml-2" />
      </form>

      {/* Abas */}
      <div className="flex space-x-4 mb-6">
        {Object.keys(results).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 rounded-md ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="mt-8 w-full max-w-2xl">
        {isSearching && <p className="text-center text-blue-500">Buscando...</p>}

        {!isSearching && results[activeTab]?.length > 0 && (
          <div>
            {results[activeTab].map((result) => (
              <div key={result.id} className="mb-4 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-blue-800 hover:underline cursor-pointer">
                  {result.title}
                </h2>
                <p className="text-gray-600">{result.description}</p>
              </div>
            ))}
          </div>
        )}

        {!isSearching && results[activeTab]?.length === 0 && (
          <p className="text-center text-gray-500">Nenhum resultado encontrado para "{query}"</p>
        )}
      </div>
    </div>
  );
};

export default ConnectionsSearchDesk;
